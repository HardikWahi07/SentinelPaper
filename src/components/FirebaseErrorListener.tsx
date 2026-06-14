
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, we want to see the rich contextual error.
      // In production, this might be handled differently.
      console.error('Firebase Permission Error:', error.context);
      
      toast({
        variant: "destructive",
        title: "Security Rule Violation",
        description: `Operation '${error.context.operation}' denied on path: ${error.context.path}. Check your Firestore Security Rules.`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
