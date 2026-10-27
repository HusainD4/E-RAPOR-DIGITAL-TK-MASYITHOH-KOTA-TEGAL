import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditTrailService } from '../../modules/audit-trail/audit-trail.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditTrailService: AuditTrailService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = req;

    // Only log modifying actions (POST, PUT, PATCH, DELETE)
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(() => {
        if (isStateChanging && user) {
          this.auditTrailService.log({
            userId: user.id,
            role: user.role,
            schoolId: user.schoolId,
            action: `${method} ${url}`,
            resource: url.split('?')[0],
            ipAddress: ip,
            userAgent: headers['user-agent'],
            metadata: {
              body: this.sanitizeBody(req.body),
            },
          });
        }
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '***REDACTED***';
    if (sanitized.passwordHash) sanitized.passwordHash = '***REDACTED***';
    return sanitized;
  }
}
