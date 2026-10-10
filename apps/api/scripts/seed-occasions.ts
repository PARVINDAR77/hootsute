import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

export interface CuratedOccasion {
  name: string;
  slug: string;
  description: string;
  culturalContext: string;
  category: string;
  dateType: 'FIXED_GREGORIAN' | 'LUNAR_CALENDAR' | 'REGIONAL_SEASONAL';
  typicalPeriod: string;
  supportedRegions: string[];
  promptGuidance: string;
  suggestedHashtags: string[];
}

export const CURATED_OCCASIONS: CuratedOccasion[] = [
  {
    name: 'Diwali (Deepavali)',
    slug: 'diwali',
    description: 'The festival of lights celebrating the victory of light over darkness, wisdom over ignorance, and prosperity.',
    culturalContext: 'Celebrated across India and the global diaspora with lighting diyas, rangoli, family gatherings, Lakshmi Puja, sharing sweets, and fireworks. Highly auspicious for commerce, new ledger openings (Chopda Pujan), and celebratory business campaigns.',
    category: 'Major Festival',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'October - November (Kartik Amavasya; determined by Hindu lunar calendar)',
    supportedRegions: ['All India', 'Gujarat', 'Global Diaspora'],
    promptGuidance: 'Tone: warm, celebratory, prosperous, welcoming. Highlight light, hope, gratitude, prosperity, and joy. For businesses, focus on wishing prosperity and heartfelt gratitude to patrons rather than aggressive push sales.',
    suggestedHashtags: ['#Diwali', '#Deepavali', '#FestivalOfLights', '#HappyDiwali', '#ShubhDeepawali', '#ProsperityAndJoy'],
  },
  {
    name: 'Holi (Festival of Colours)',
    slug: 'holi',
    description: 'Vibrant spring festival celebrating unity, the arrival of spring, joy, and the triumph of virtue.',
    culturalContext: 'Includes Holika Dahan bonfire on the eve, followed by playful splashing of organic Gulal colors, folk songs, traditional delicacies like gujiya, and reconciliation of relationships.',
    category: 'Major Festival',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'February - March (Phalguna Purnima; determined by Hindu lunar calendar)',
    supportedRegions: ['All India', 'Global Diaspora'],
    promptGuidance: 'Tone: vibrant, playful, energetic, inclusive. Focus on adding colors of happiness, renewal, unity, and fresh beginnings. Emphasize eco-friendly celebrations, care, and cheerfulness.',
    suggestedHashtags: ['#Holi', '#FestivalOfColours', '#HappyHoli', '#RangBarse', '#ColoursOfJoy', '#SpringFestival'],
  },
  {
    name: 'Navratri',
    slug: 'navratri',
    description: 'Nine nights of divine feminine celebration, rhythmic Garba, Dandiya Raas, and spiritual devotion.',
    culturalContext: 'Particularly celebrated with grand fervor in Gujarat and western India. Devotees honor Goddess Durga in nine forms with nightly communal Garba dance circles, vibrant Chaniya Cholis and Kediyus, and fasting rituals.',
    category: 'Cultural & Regional',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'September - October (Ashwin Shukla Pratipada to Navami; determined by Hindu lunar calendar)',
    supportedRegions: ['Gujarat', 'All India', 'Global Diaspora'],
    promptGuidance: 'Tone: rhythmic, devoted, colorful, spirited. Weave in motifs of Garba rhythms, Dhol beats, colorful traditional attire, divine blessings, and communal celebration. Respectful yet enthusiastic.',
    suggestedHashtags: ['#Navratri', '#GarbaNight', '#Dandiya', '#HappyNavratri', '#NavratriVibes', '#JaiMataDi'],
  },
  {
    name: 'Eid-ul-Fitr',
    slug: 'eid-ul-fitr',
    description: 'Sacred Islamic festival marking the joyous conclusion of Ramadan, the holy month of fasting, reflection, and charity.',
    culturalContext: 'Celebrated by Muslims worldwide with early morning communal prayers (Salat al-Eid), giving Zakat al-Fitr (charity), feasting on Sheer Khurma, wearing fine attire, and exchanging blessings of peace and forgiveness.',
    category: 'Major Festival',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'Determined by moon sighting at the conclusion of Ramadan (1st of Shawwal in the Hijri calendar)',
    supportedRegions: ['All India', 'Global'],
    promptGuidance: 'Tone: serene, gracious, peaceful, benevolent, thankful. Emphasize peace, compassion, charitable generosity, brotherhood, and blessings for families and communities.',
    suggestedHashtags: ['#EidMubarak', '#EidUlFitr', '#BlessingsOfEid', '#PeaceAndHarmony', '#JoyOfSharing'],
  },
  {
    name: 'Christmas',
    slug: 'christmas',
    description: 'Celebration of peace, joy, goodwill, the birth of Jesus Christ, and seasonal gift-giving.',
    culturalContext: 'Celebrated on December 25 with church midnight services, decorated Christmas trees, carols, feasts, and exchanging tokens of affection and generosity with family, friends, and colleagues.',
    category: 'Major Festival',
    dateType: 'FIXED_GREGORIAN',
    typicalPeriod: 'December 25 (Fixed annual Gregorian date)',
    supportedRegions: ['All India', 'Global'],
    promptGuidance: 'Tone: heartwarming, festive, cheerful, generous. Highlight warmth, gratitude, togetherness, peace on earth, and good tidings as the year draws to a close.',
    suggestedHashtags: ['#MerryChristmas', '#ChristmasVibes', '#SeasonOfGiving', '#JoyToTheWorld', '#HolidayCheer'],
  },
  {
    name: 'Independence Day',
    slug: 'independence-day',
    description: 'National commemoration of India gaining freedom on August 15, 1947.',
    culturalContext: 'Celebrated across all states, schools, government offices, and corporations with tricolor flag hoisting, national anthem, tributes to freedom fighters, and civic pride.',
    category: 'National Observance',
    dateType: 'FIXED_GREGORIAN',
    typicalPeriod: 'August 15 (Fixed annual Gregorian date)',
    supportedRegions: ['All India'],
    promptGuidance: 'Tone: dignified, patriotic, inspiring, resolute. Emphasize national unity, innovation, progress, sacrifice of freedom heroes, and dedication to building an inclusive and prosperous nation.',
    suggestedHashtags: ['#IndependenceDay', '#IndiaAt79', '#JaiHind', '#ProudIndian', '#VandeMataram', '#HarGharTiranga'],
  },
  {
    name: 'Republic Day',
    slug: 'republic-day',
    description: 'Celebration of the enactment of the Constitution of India on January 26, 1950.',
    culturalContext: 'Marked by the grand ceremonial parade at Kartavya Path in New Delhi displaying defense capabilities and cultural heritage tableaux, alongside regional flag hoisting and civic reflections on democratic values.',
    category: 'National Observance',
    dateType: 'FIXED_GREGORIAN',
    typicalPeriod: 'January 26 (Fixed annual Gregorian date)',
    supportedRegions: ['All India'],
    promptGuidance: 'Tone: solemn, proud, constitutional, visionary. Focus on constitutional heritage, democratic principles, civic duty, technological growth, and our vibrant diversity.',
    suggestedHashtags: ['#RepublicDay', '#IndianRepublic', '#ConstitutionOfIndia', '#JaiHind', '#ProudToBeIndian'],
  },
  {
    name: 'Raksha Bandhan',
    slug: 'raksha-bandhan',
    description: 'Sacred celebration of brotherly and sisterly love, mutual protection, and enduring familial bonds.',
    culturalContext: 'Sisters tie sacred amulets (rakhi) around their brothers\' or protective figures\' wrists, pray for their well-being, and receive gifts and promises of support. Extends broadly to protective friendship and community care.',
    category: 'Major Festival',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'August (Shravana Purnima; determined by Hindu lunar calendar)',
    supportedRegions: ['All India', 'Global Diaspora'],
    promptGuidance: 'Tone: affectionate, nostalgic, caring, supportive. Highlight lifelong bonds, selfless support, cherished sibling memories, and heartfelt tokens of appreciation.',
    suggestedHashtags: ['#RakshaBandhan', '#HappyRakhi', '#SiblingLove', '#BondOfLove', '#RakhiCelebration'],
  },
  {
    name: 'Uttarayan / Makar Sankranti',
    slug: 'uttarayan-makar-sankranti',
    description: 'The International Kite Flying Festival and solar transition marking the northward journey of the sun.',
    culturalContext: 'Celebrated across Gujarat and India with rooftop kite-flying duels ("Kai Po Che!"), savouring seasonal delicacies like Undhiyu, Jalebi, Chikki (sesame brittle), and thanksgiving to the solar deity for agricultural bounty.',
    category: 'Cultural & Regional',
    dateType: 'FIXED_GREGORIAN',
    typicalPeriod: 'January 14 - 15 (Fixed solar transition date in Gregorian calendar)',
    supportedRegions: ['Gujarat', 'All India'],
    promptGuidance: 'Tone: exhilarating, sunny, soaring, communal. Emphasize soaring high, flying beyond limits, colorful skies, the cries of "Kai Po Che!", and sharing delicious winter treats.',
    suggestedHashtags: ['#Uttarayan', '#MakarSankranti', '#KaiPoChe', '#KiteFestival', '#SkyIsTheLimit', '#UndhiyuParty'],
  },
  {
    name: 'Gujarati New Year (Bestu Varas)',
    slug: 'gujarati-new-year',
    description: 'The auspicious first day of the Vikram Samvat calendar year, immediately following Diwali.',
    culturalContext: 'Celebrated predominantly in Gujarat and by Gujarati communities worldwide. Marked by greeting each other with "Saal Mubarak" or "Nutan Varshabhinandan", seeking blessings from elders, opening new business ledgers, and visiting temples.',
    category: 'Cultural & Regional',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'October - November (Kartik Sud Ekam; the day after Diwali)',
    supportedRegions: ['Gujarat', 'Global Diaspora'],
    promptGuidance: 'Tone: respectful, warm, forward-looking, culturally rooted. Include warm Gujarati greetings such as "Saal Mubarak" and "Nutan Varshabhinandan". Express hopes for abundance, sound health, and commercial success in the coming year.',
    suggestedHashtags: ['#BestuVaras', '#GujaratiNewYear', '#SaalMubarak', '#NutanVarshabhinandan', '#VikramSamvat'],
  },
  {
    name: 'Janmashtami (Krishna Janmashtami)',
    slug: 'janmashtami',
    description: 'Joyous celebration of the birth of Lord Krishna, embodiment of love, wisdom, and righteousness.',
    culturalContext: 'Observed with midnight vigil prayers, devotional bhajans, fasting, decorative cradles for Bal Krishna, and Dahi Handi human pyramid spectacles particularly in Gujarat (Dwarka) and Maharashtra.',
    category: 'Major Festival',
    dateType: 'LUNAR_CALENDAR',
    typicalPeriod: 'August - September (Bhadrapada Krishna Ashtami; determined by Hindu lunar calendar)',
    supportedRegions: ['All India', 'Gujarat', 'Global Diaspora'],
    promptGuidance: 'Tone: devotional, celebratory, joyful, peaceful. Weave in themes of divine wisdom (Bhagavad Gita), playful innocence, flute melodies, and community harmony.',
    suggestedHashtags: ['#Janmashtami', '#KrishnaJanmashtami', '#HappyJanmashtami', '#RadheKrishna', '#DahiHandi'],
  },
  {
    name: 'Rann Utsav',
    slug: 'rann-utsav',
    description: 'The world-renowned winter cultural carnival celebrating the pristine White Desert of Kutch.',
    culturalContext: 'Held amidst the glistening salt plains of Dhordo in Kutch, Gujarat. Features vibrant tent cities, Kutchi embroidery, folk music, Sufi melodies, camel safaris, and night viewing under the full moon.',
    category: 'Cultural & Regional',
    dateType: 'REGIONAL_SEASONAL',
    typicalPeriod: 'November to February (Winter season in Kutch; special emphasis on Full Moon nights)',
    supportedRegions: ['Gujarat', 'Global Travelers'],
    promptGuidance: 'Tone: enchanting, cultural, scenic, exploratory. Evoke the ethereal beauty of white salt desert dunes under moonlight, soulful Kutchi folk songs, mirror-work textiles, and timeless desert serenity.',
    suggestedHashtags: ['#RannUtsav', '#KutchDiaries', '#WhiteDesert', '#GujaratTourism', '#FullMoonInRann', '#ColorsOfKutch'],
  },
];

export async function seedOccasions() {
  console.log('--- Starting Idempotent Seed: Curated Festival & Occasion Catalog ---');
  let createdCount = 0;
  let preservedCount = 0;

  for (const occasion of CURATED_OCCASIONS) {
    const existing = await prisma.festivalOccasion.findUnique({
      where: { slug: occasion.slug },
    });

    if (existing) {
      // Idempotency guarantee: Preserve legitimate administrator edits by not overwriting
      preservedCount++;
      console.log(`[PRESERVED] Occasion "${occasion.name}" (${occasion.slug}) already exists. Preserving existing record.`);
    } else {
      await prisma.festivalOccasion.create({
        data: {
          name: occasion.name,
          slug: occasion.slug,
          description: occasion.description,
          culturalContext: occasion.culturalContext,
          category: occasion.category,
          dateType: occasion.dateType,
          typicalPeriod: occasion.typicalPeriod,
          supportedRegions: occasion.supportedRegions,
          promptGuidance: occasion.promptGuidance,
          suggestedHashtags: occasion.suggestedHashtags,
          isActive: true,
        },
      });
      createdCount++;
      console.log(`[CREATED] Occasion "${occasion.name}" (${occasion.slug}) seeded successfully.`);
    }
  }

  const total = await prisma.festivalOccasion.count();
  console.log('----------------------------------------------------');
  console.log(`Seed Summary: Created: ${createdCount}, Preserved: ${preservedCount}, Total in DB: ${total}`);
  console.log('--- Seeding Completed Successfully ---');

  return { createdCount, preservedCount, total };
}

if (require.main === module) {
  seedOccasions()
    .catch((err) => {
      console.error('Failed to seed festival occasions:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
