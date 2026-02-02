'use client';

/**
 * Hub central de exportações do Firebase.
 * Redireciona para os módulos específicos para evitar dependências circulares.
 */

export * from './firebase';
export { db as firestore } from './firebase'; 
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
