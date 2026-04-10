import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export type ChangeType = 'status_management' | 'portability_rules' | 'appearance' | 'commission_rules';

export async function logSignificantChange(
    firestore: Firestore | null, 
    userId: string, 
    type: ChangeType, 
    description: string,
    metadata?: any
) {
    if (!firestore || !userId) return;

    try {
        await addDoc(collection(firestore, 'systemUpdateLogs'), {
            userId,
            type,
            description,
            metadata,
            timestamp: serverTimestamp(),
            isProcessed: false // Para posterior consumo por script de manual
        });
        console.log(`[Logger] Change registered: ${type}`);
    } catch (e) {
        console.error('[Logger] Error logging change:', e);
    }
}
