'use client';

/**
 * 📦 HUB CENTRAL FIREBASE LK RAMOS
 * Exportações centralizadas para manter a consistência do projeto.
 */

export * from './firebase';
export { db as firestore } from './firebase'; 
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
