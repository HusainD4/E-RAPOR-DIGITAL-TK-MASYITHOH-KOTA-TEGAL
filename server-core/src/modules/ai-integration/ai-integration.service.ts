import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiIntegrationService {
  private readonly logger = new Logger(AiIntegrationService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateNarrative(payload: {
    studentName: string;
    level: string;
    assessments: Array<{ aspect: string; score: string; notes?: string }>;
    anecdotes: Array<{ eventContext: string; observedBehavior: string }>;
  }): Promise<{ narrative: string; source: 'ai-engine' | 'local-fallback' }> {
    const aiUrl = this.configService.get<string>('microservices.ai.url', 'http://127.0.0.1:8001');
    const apiKey = this.configService.get<string>('microservices.ai.apiKey', '');

    try {
      const response = await axios.post(
        `${aiUrl}/api/v1/narratives/generate`,
        payload,
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.narrative) {
        return { narrative: response.data.narrative, source: 'ai-engine' };
      }
    } catch (err) {
      this.logger.warn(`AI engine request failed: ${err.message}. Using heuristic fallback narrative.`);
    }

    // Resilient fallback rule-based narrative generator if AI service is offline
    const fallback = this.createFallbackNarrative(payload);
    return { narrative: fallback, source: 'local-fallback' };
  }

  private createFallbackNarrative(payload: {
    studentName: string;
    level: string;
    assessments: Array<{ aspect: string; score: string; notes?: string }>;
  }): string {
    const { studentName, assessments } = payload;
    const strengths = assessments.filter((a) => a.score === 'BSB' || a.score === 'BSH');
    const developing = assessments.filter((a) => a.score === 'MB' || a.score === 'BB');

    let text = `Alhamdulillah, ananda ${studentName} menunjukkan capaian perkembangan yang positif pada semester ini. `;

    if (strengths.length > 0) {
      text += `Ananda berkembang sangat baik dalam aspek: ${strengths.map((s) => s.aspect).join(', ')}. `;
    }

    if (developing.length > 0) {
      text += `Adapun aspek yang terus kita dorong bersama dengan penuh kasih sayang di rumah dan sekolah mencakup: ${developing.map((d) => d.aspect).join(', ')}. `;
    }

    text += `Semoga ananda terus ceria, berakhlak mulia, dan bersemangat dalam belajar.`;
    return text;
  }
}
