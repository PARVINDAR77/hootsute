import {
  AutomationRecipeDto,
  AutomationTriggerType,
  AutomationActionType,
} from '@packages/shared';

export const AUTOMATION_RECIPES: AutomationRecipeDto[] = [
  {
    id: 'recipe-spam-shield',
    name: 'Smart Spam & Scammer Shield',
    description: 'Automatically hides abusive comments, scam solicitations, telegram/whatsapp spam, and foreign links on Facebook and Instagram.',
    category: 'MODERATION',
    triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
    actionType: AutomationActionType.AUTO_HIDE_SPAM,
    defaultConditions: {
      keywords: [
        'whatsapp me',
        'telegram',
        'crypto',
        'forex',
        'free money',
        'inbox me',
        'click link',
        'dm to earn',
        'invest now',
        'casino',
        'betting',
        'lottery',
      ],
      matchType: 'ANY',
    },
    defaultActionConfig: {
      replyTemplate: '',
    },
  },
  {
    id: 'recipe-lead-responder',
    name: 'Instant Lead & Price Responder',
    description: 'Automatically sends a helpful instant reply when a customer asks about prices, plans, or product availability in public comments.',
    category: 'ENGAGEMENT',
    triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
    actionType: AutomationActionType.AUTO_REPLY,
    defaultConditions: {
      keywords: ['price', 'cost', 'how much', 'rate', 'quote', 'fees', 'bhav', 'discount', 'charges'],
      matchType: 'ANY',
    },
    defaultActionConfig: {
      replyTemplate: 'Thank you for reaching out! We would love to assist you. Our team has sent you a direct message with full catalog details.',
    },
  },
  {
    id: 'recipe-festival-drafter',
    name: 'Cultural Festival AI Auto-Drafter',
    description: 'Triggers AI prompt synthesis and prepares draft variants 7 days prior to upcoming Indian cultural and regional festivals.',
    category: 'AI_MARKETING',
    triggerType: AutomationTriggerType.OCCASION_UPCOMING,
    actionType: AutomationActionType.GENERATE_AI_DRAFT,
    defaultConditions: {
      daysBefore: 7,
    },
    defaultActionConfig: {
      aiPromptPrefix: 'Generate a vibrant, culturally resonant festival greeting post celebrating',
    },
  },
  {
    id: 'recipe-slack-publish-alert',
    name: 'Team Webhook Alert on Post Publish',
    description: 'Dispatches an instant JSON webhook payload to Slack, Discord, or Zapier when a scheduled post is successfully published.',
    category: 'INTEGRATION',
    triggerType: AutomationTriggerType.POST_PUBLISHED,
    actionType: AutomationActionType.DISPATCH_WEBHOOK,
    defaultConditions: {},
    defaultActionConfig: {
      webhookUrl: 'https://hooks.slack.com/services/placeholder',
    },
  },
];
