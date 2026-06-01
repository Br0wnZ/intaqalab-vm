import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware para simular latencia de red en entornos de desarrollo/mock
 * @param ms Milisegundos de retraso
 */
export const delayResponse = (ms: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    setTimeout(next, ms);
  };
};
