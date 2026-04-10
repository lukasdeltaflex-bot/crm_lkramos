import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { PortabilityRule } from '@/lib/types';

const COLLECTION_NAME = 'portabilityRules';

export const portabilityRulesService = {
  /**
   * Create a new rule
   */
  async createRule(ruleData: Omit<PortabilityRule, 'id' | 'updatedAt' | 'version' | 'isActive' | 'isCurrent'>, userId: string): Promise<string> {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const now = new Date().toISOString();
    
    const newRule: PortabilityRule = {
      ...ruleData,
      id: docRef.id,
      ownerId: userId,
      isActive: true,
      isCurrent: true,
      version: 1,
      updatedAt: now,
    };

    await setDoc(docRef, newRule);
    return docRef.id;
  },

  /**
   * Update an existing rule (creates a new version)
   */
  async updateRule(ruleId: string, ruleData: Partial<PortabilityRule>, userId: string): Promise<string> {
    const oldDocRef = doc(db, COLLECTION_NAME, ruleId);
    const oldDocSnap = await getDoc(oldDocRef);
    
    if (!oldDocSnap.exists()) {
      throw new Error("Regra não encontrada");
    }
    
    const oldRule = oldDocSnap.data() as PortabilityRule;
    if (oldRule.ownerId !== userId) {
      throw new Error("Sem permissão para editar esta regra");
    }

    // Inactivate old rule
    await updateDoc(oldDocRef, {
      isCurrent: false,
      isActive: false,
      validUntil: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create new version
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const now = new Date().toISOString();
    
    const newRule: PortabilityRule = {
      ...oldRule,
      ...ruleData,
      id: newDocRef.id,
      version: oldRule.version + 1,
      validFrom: now,
      // Se não for passado um validUntil diferente, assume o antigo ou um longo caso não tenha.
      validUntil: ruleData.validUntil || '2099-12-31T23:59:59Z',
      isCurrent: true,
      isActive: ruleData.isActive !== undefined ? ruleData.isActive : true,
      updatedAt: now,
    };

    await setDoc(newDocRef, newRule);
    return newDocRef.id;
  },

  /**
   * Toggle Active Status
   */
  async toggleActive(ruleId: string, isActive: boolean, userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, ruleId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Soft Delete or Hard Delete (Hard Delete neste caso por ser config)
   */
  async deleteRule(ruleId: string, userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, ruleId);
    await deleteDoc(docRef);
  },

  /**
   * Get Current Rules for a User
   */
  async getCurrentRules(userId: string): Promise<PortabilityRule[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('ownerId', '==', userId),
      where('isCurrent', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PortabilityRule);
  }
};
