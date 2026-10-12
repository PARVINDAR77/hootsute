import { Injectable, Logger } from '@nestjs/common';
import { ListeningSentiment } from '@packages/shared';

export interface SentimentAnalysisResult {
  sentiment: ListeningSentiment;
  sentimentScore: number;
  isCrisisAlert: boolean;
  detectedKeywords: string[];
}

@Injectable()
export class SentimentAnalyzerService {
  private readonly logger = new Logger(SentimentAnalyzerService.name);

  private readonly positiveLexicon = new Set([
    'love', 'loved', 'great', 'awesome', 'amazing', 'excellent', 'fantastic',
    'best', 'good', 'superb', 'outstanding', 'fast', 'smooth', 'helpful',
    'recommend', 'recommended', 'perfect', 'brilliant', 'delightful', 'winner',
    'impressive', 'valuable', 'saved', 'gamechanger', 'seamless', 'happy',
    'reliable', 'top-notch', 'solid', 'efficient', 'intuitive', 'easy', 'kudos',
  ]);

  private readonly negativeLexicon = new Set([
    'hate', 'terrible', 'worst', 'awful', 'bad', 'horrible', 'broken',
    'slow', 'laggy', 'buggy', 'glitch', 'error', 'failed', 'failing',
    'useless', 'unhelpful', 'scam', 'fraud', 'cheat', 'frustrated',
    'disappointed', 'complaint', 'down', 'outage', 'crash', 'crashed',
    'overpriced', 'poor', 'cancel', 'cancelled', 'refund', 'sucks', 'rubbish',
  ]);

  private readonly crisisLexicon = new Set([
    'scam', 'fraud', 'lawsuit', 'data breach', 'breach', 'security leak',
    'hacked', 'stolen', 'boycott', 'illegal', 'investigation', 'toxic',
    'ransomware', 'exploit', 'major outage', 'unauthorized charge',
  ]);

  private readonly negations = new Set([
    'not', "don't", 'doesnt', "doesn't", 'never', 'no', 'without', 'hardly',
    "wasn't", 'wasnt', "isn't", 'isnt', "couldn't", 'couldnt', "can't", 'cant',
  ]);

  private readonly intensifiers: Record<string, number> = {
    very: 1.5,
    extremely: 2.0,
    absolutely: 2.0,
    super: 1.5,
    highly: 1.5,
    incredibly: 2.0,
    really: 1.3,
  };

  /**
   * Analyzes text and returns normalized sentiment score (-1.0 to 1.0) and sentiment enum
   */
  analyze(text: string): SentimentAnalysisResult {
    if (!text || !text.trim()) {
      return {
        sentiment: ListeningSentiment.NEUTRAL,
        sentimentScore: 0.0,
        isCrisisAlert: false,
        detectedKeywords: [],
      };
    }

    const lower = text.toLowerCase();
    const words = lower.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);

    let positiveScore = 0;
    let negativeScore = 0;
    const detected: string[] = [];
    let isCrisisAlert = false;

    // Check crisis keywords first
    for (const crisisPhrase of this.crisisLexicon) {
      if (lower.includes(crisisPhrase)) {
        isCrisisAlert = true;
        negativeScore += 3.0;
        detected.push(crisisPhrase);
      }
    }

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = i > 0 ? words[i - 1] : '';
      const isNegated = this.negations.has(prevWord);
      const intensity = this.intensifiers[prevWord] || 1.0;

      if (this.positiveLexicon.has(word)) {
        detected.push(word);
        if (isNegated) {
          negativeScore += 1.0 * intensity;
        } else {
          positiveScore += 1.0 * intensity;
        }
      } else if (this.negativeLexicon.has(word)) {
        detected.push(word);
        if (isNegated) {
          positiveScore += 0.8 * intensity;
        } else {
          negativeScore += 1.0 * intensity;
        }
      }
    }

    const totalWeight = positiveScore + negativeScore;
    let rawScore = 0;

    if (totalWeight > 0) {
      rawScore = (positiveScore - negativeScore) / totalWeight;
    }

    // Clamp score strictly between -1.0 and 1.0
    const sentimentScore = parseFloat(Math.max(-1.0, Math.min(1.0, rawScore)).toFixed(2));

    let sentiment: ListeningSentiment = ListeningSentiment.NEUTRAL;
    if (sentimentScore >= 0.15) {
      sentiment = ListeningSentiment.POSITIVE;
    } else if (sentimentScore <= -0.15) {
      sentiment = ListeningSentiment.NEGATIVE;
    }

    return {
      sentiment,
      sentimentScore,
      isCrisisAlert,
      detectedKeywords: Array.from(new Set(detected)),
    };
  }
}
