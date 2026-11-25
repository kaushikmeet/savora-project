import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const token = authService.accessToken;

  if (!token || !req.url.startsWith('http://localhost:3000')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};