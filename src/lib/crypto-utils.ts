/**
 * 🔐 MOTOR DE CRIPTOGRAFIA AES-256-GCM (LK RAMOS)
 * Utiliza a Web Crypto API nativa para garantir que senhas nunca fiquem em texto limpo no banco.
 */

const SALT = "lk-ramos-security-v1"; // Salt fixo para derivação de chave

async function getEncryptionKey(uid: string) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(uid),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(SALT),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptPassword(password: string, uid: string): Promise<string> {
    if (typeof window === "undefined") return ""; // 🛡️ SSR Safe
    if (!password) return "";
    try {
        const key = await getEncryptionKey(uid);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            enc.encode(password)
        );

        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
        return `${ivHex}:${cipherHex}`;
    } catch (e) {
        console.error("Encryption failed", e);
        return "";
    }
}

export async function decryptPassword(encryptedData: string, uid: string): Promise<string> {
    if (typeof window === "undefined") return ""; // 🛡️ SSR Safe
    if (!encryptedData || !encryptedData.includes(':')) return "";
    try {
        const [ivHex, cipherHex] = encryptedData.split(':');
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        
        const key = await getEncryptionKey(uid);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        return "********"; // Retorno de segurança se falhar
    }
}
