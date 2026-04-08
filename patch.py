import re
import sys

TARGET_FILE = r"C:\Users\lukas\OneDrive\Área de Trabalho\lkmovie01\src\app\(dashboard)\editor\page.tsx"

with open(TARGET_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add MOCK_VIDEO and MOCK_SUBTITLES
imports_end = content.find('const MOCK_TRACKS')
mock_data = '''const MOCK_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

const MOCK_SUBTITLES = [
  { start: 0, end: 2, pt: "Bem-vindo ao LKMOVIE01!", en: "Welcome to LKMOVIE01!" },
  { start: 2, end: 5, pt: "Este é o novo editor atualizado.", en: "This is the new updated editor." },
  { start: 5, end: 8, pt: "As legendas acompanham o vídeo.", en: "Subtitles follow the video." },
  { start: 8, end: 15, pt: "É possível ouvir a música de fundo.", en: "You can hear the background music." }
];

'''
# Only add if not already there
if "MOCK_VIDEO =" not in content:
    content = content[:imports_end] + mock_data + content[imports_end:]

# 2. Fix activeVideoContent
content = re.sub(
    r'(const activeVideoContent = useMemo\(\(\) => \{.+?return currentEvent\?\.content \|\| \(clips\[activeClipIndex\]\?\.thumbnail\);)',
    r'const activeVideoContent = useMemo(() => {\n    const currentEvent = timeline.find(e => e.type === "video" && currentTime >= e.startTime && currentTime <= e.startTime + e.duration);\n    return currentEvent?.content || clips[activeClipIndex]?.url || MOCK_VIDEO;',
    content,
    flags=re.DOTALL
)

# 3. Add audioRef and synchronization logic
audio_ref_addition = '''
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume / 100;
  }, [musicVolume]);
'''
if "const audioRef =" not in content:
    content = content.replace('const timelineRef = useRef<HTMLDivElement>(null);', 'const timelineRef = useRef<HTMLDivElement>(null);' + audio_ref_addition)

toggle_play_orig = '''  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };'''

toggle_play_new = '''  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
      }
      else {
        videoRef.current.play();
        if (audioRef.current && (audioMode === "mix" || audioMode === "music")) audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };'''
content = content.replace(toggle_play_orig, toggle_play_new)

handle_seek_orig = '''  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };'''

handle_seek_new = '''  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };'''
content = content.replace(handle_seek_orig, handle_seek_new)

# 4. Integrate Dynamic Subtitles
subtitle_logic = '''
  const currentSubtitleObj = useMemo(() => {
    return MOCK_SUBTITLES.find(s => currentTime >= s.start && currentTime <= s.end);
  }, [currentTime]);

  const renderSubtitleTextPT = currentSubtitleObj?.pt || globalSubtitle.text;
  const renderSubtitleTextEN = currentSubtitleObj?.en || globalSubtitle.textEn;
'''
if "const currentSubtitleObj =" not in content:
    content = content.replace('const filteredTracks = useMemo(() => {', subtitle_logic + '\n  const filteredTracks = useMemo(() => {')
    content = content.replace('{globalSubtitle.text}', '{renderSubtitleTextPT}')
    content = content.replace('{globalSubtitle.textEn}', '{renderSubtitleTextEN}')

# Fix font application
content = re.sub(
    r'fontFamily: globalSubtitle\.font',
    r'fontFamily: `"${globalSubtitle.font}", sans-serif`',
    content
)

# 5. Add Audio Player to JSX and improve fonts link
jsx_changes = '''
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Poppins:wght@400;700;900&family=Roboto:wght@400;700;900&display=swap" rel="stylesheet" />
      {selectedMusic && <audio ref={audioRef} src={selectedMusic.url} loop />}
'''
if "<audio ref={audioRef}" not in content:
    content = content.replace('{isRendering && (', jsx_changes + '{isRendering && (')

# 6. Improve UX & UI scale
content = content.replace('w-[360px]', 'w-[420px]')
content = content.replace("height: '60%", "height: '75%")
content = content.replace('text-[8px]', 'text-[10px]')
content = content.replace('text-[9px]', 'text-xs')
content = content.replace('text-[10px]', 'text-sm')

# 7. Safe Zones improvement
safe_zone_orig = '''               {videoConfig.safeZones && videoConfig.aspectRatio === "9:16" && (
                 <div className="absolute inset-0 pointer-events-none border border-white/5 mix-blend-overlay">
                    <div className="absolute inset-x-0 top-[15%] bottom-[15%] border-y border-white/10"></div>
                 </div>
               )}'''

safe_zone_new = '''               {videoConfig.safeZones && videoConfig.aspectRatio === "9:16" && (
                 <div className="absolute inset-x-0 inset-y-0 pointer-events-none z-50 flex flex-col justify-between">
                   <div className="h-[15%] w-full bg-red-500/20 border-b border-red-500 flex items-center justify-center">
                     <span className="text-white font-black text-xs uppercase drop-shadow-md shadow-black">Inseguro (UI Superior)</span>
                   </div>
                   <div className="h-[25%] w-full bg-red-500/20 border-t border-red-500 flex items-center justify-center">
                     <span className="text-white font-black text-xs uppercase drop-shadow-md shadow-black">Inseguro (UI Inferior)</span>
                   </div>
                 </div>
               )}'''

content = content.replace(safe_zone_orig, safe_zone_new)

with open(TARGET_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
