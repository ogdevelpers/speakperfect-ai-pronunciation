import { WordChallenge, Level } from './types';

// All available words organized by difficulty
const ALL_WORDS: WordChallenge[] = [
  // Low/Easy words
  {
    id: '1',
    word: 'Squirrel',
    phonetic: '/ˈskwər(ə)l/',
    definition: 'A rodent with a bushy tail.',
    difficulty: 'Easy'
  },
  {
    id: '2',
    word: 'Specific',
    phonetic: '/spəˈsɪfɪk/',
    definition: 'Clearly defined or identified.',
    difficulty: 'Easy'
  },
  {
    id: '3',
    word: 'Beautiful',
    phonetic: '/ˈbjuːtɪf(ə)l/',
    definition: 'Pleasing the senses or mind aesthetically.',
    difficulty: 'Easy'
  },
  {
    id: '4',
    word: 'Library',
    phonetic: '/ˈlaɪbrəri/',
    definition: 'A building or room containing collections of books.',
    difficulty: 'Easy'
  },
  {
    id: '5',
    word: 'February',
    phonetic: '/ˈfebruəri/',
    definition: 'The second month of the year.',
    difficulty: 'Easy'
  },
  {
    id: '6',
    word: 'Comfortable',
    phonetic: '/ˈkʌmftəb(ə)l/',
    definition: 'Providing physical ease and relaxation.',
    difficulty: 'Easy'
  },
  {
    id: '7',
    word: 'Temperature',
    phonetic: '/ˈtemprətʃə/',
    definition: 'The degree of heat present in a substance or object.',
    difficulty: 'Easy'
  },
  {
    id: '8',
    word: 'Vegetable',
    phonetic: '/ˈvedʒtəb(ə)l/',
    definition: 'A plant or part of a plant used as food.',
    difficulty: 'Easy'
  },
  {
    id: '9',
    word: 'Chocolate',
    phonetic: '/ˈtʃɒklət/',
    definition: 'A food made from roasted and ground cacao seeds.',
    difficulty: 'Easy'
  },
  {
    id: '10',
    word: 'Wednesday',
    phonetic: '/ˈwenzdeɪ/',
    definition: 'The day of the week before Thursday.',
    difficulty: 'Easy'
  },
  // Medium words
  {
    id: '11',
    word: 'Ephemeral',
    phonetic: '/əˈfem(ə)rəl/',
    definition: 'Lasting for a very short time.',
    difficulty: 'Medium'
  },
  {
    id: '12',
    word: 'Anemone',
    phonetic: '/əˈnemənē/',
    definition: 'A plant of the buttercup family.',
    difficulty: 'Medium'
  },
  {
    id: '13',
    word: 'Mischievous',
    phonetic: '/ˈmɪstʃɪvəs/',
    definition: 'Causing or showing a fondness for causing trouble in a playful way.',
    difficulty: 'Medium'
  },
  {
    id: '14',
    word: 'Phenomenon',
    phonetic: '/fəˈnɑːmɪnən/',
    definition: 'A fact or situation that is observed to exist or happen.',
    difficulty: 'Medium'
  },
  {
    id: '15',
    word: 'Hierarchy',
    phonetic: '/ˈhaɪərɑːrki/',
    definition: 'A system in which members are ranked according to relative status.',
    difficulty: 'Medium'
  },
  {
    id: '16',
    word: 'Pronunciation',
    phonetic: '/prəˌnʌnsiˈeɪʃ(ə)n/',
    definition: 'The way in which a word is pronounced.',
    difficulty: 'Medium'
  },
  {
    id: '17',
    word: 'Entrepreneur',
    phonetic: '/ˌɒntrəprəˈnɜː/',
    definition: 'A person who organizes and operates a business.',
    difficulty: 'Medium'
  },
  {
    id: '18',
    word: 'Conscience',
    phonetic: '/ˈkɒnʃ(ə)ns/',
    definition: 'A person\'s moral sense of right and wrong.',
    difficulty: 'Medium'
  },
  {
    id: '19',
    word: 'Acquaintance',
    phonetic: '/əˈkweɪnt(ə)ns/',
    definition: 'A person one knows slightly, but who is not a close friend.',
    difficulty: 'Medium'
  },
  {
    id: '20',
    word: 'Exaggerate',
    phonetic: '/ɪɡˈzædʒəreɪt/',
    definition: 'Represent something as being larger or greater than it really is.',
    difficulty: 'Medium'
  },
  // Hard words
  {
    id: '21',
    word: 'Worcestershire',
    phonetic: '/ˈwʊstəʃə/',
    definition: 'A savory sauce of vinegar and spices.',
    difficulty: 'Hard'
  },
  {
    id: '22',
    word: 'Colonel',
    phonetic: '/ˈkərnl/',
    definition: 'An army officer of high rank.',
    difficulty: 'Hard'
  },
  {
    id: '23',
    word: 'Rural',
    phonetic: '/ˈrʊrəl/',
    definition: 'In, relating to, or characteristic of the countryside.',
    difficulty: 'Hard'
  },
  {
    id: '24',
    word: 'Otorhinolaryngologist',
    phonetic: '/ˌoʊtoʊˌraɪnoʊˌlærɪŋˈɡɑːlədʒɪst/',
    definition: 'An ear, nose, and throat doctor.',
    difficulty: 'Hard'
  },
  {
    id: '25',
    word: 'Synchronize',
    phonetic: '/ˈsɪŋkrənaɪz/',
    definition: 'Cause to occur or operate at the same time or rate.',
    difficulty: 'Hard'
  },
  {
    id: '26',
    word: 'Chiaroscuro',
    phonetic: '/kiˌɑːrəˈskʊroʊ/',
    definition: 'The treatment of light and shade in drawing and painting.',
    difficulty: 'Hard'
  },
  {
    id: '27',
    word: 'Onomatopoeia',
    phonetic: '/ˌɒnəˌmætəˈpiːə/',
    definition: 'The formation of a word from a sound associated with what is named.',
    difficulty: 'Hard'
  },
  {
    id: '28',
    word: 'Antidisestablishmentarianism',
    phonetic: '/ˌæntiˌdɪsɪˌstæblɪʃmənˈteəriənɪzəm/',
    definition: 'Opposition to the withdrawal of state support from an established church.',
    difficulty: 'Hard'
  },
  {
    id: '29',
    word: 'Phthisis',
    phonetic: '/ˈθaɪsɪs/',
    definition: 'A disease, especially pulmonary tuberculosis.',
    difficulty: 'Hard'
  },
  {
    id: '30',
    word: 'Synecdoche',
    phonetic: '/sɪˈnekdəki/',
    definition: 'A figure of speech in which a part is made to represent the whole.',
    difficulty: 'Hard'
  }
];

// Map difficulty to level
const difficultyToLevel: Record<string, Level> = {
  'Easy': 'Low',
  'Medium': 'Medium',
  'Hard': 'Hard'
};

// Get words for a specific level (max 10)
export const getWordsByLevel = (level: Level): WordChallenge[] => {
  const levelWords = ALL_WORDS
    .filter(word => difficultyToLevel[word.difficulty] === level)
    .slice(0, 10); // Limit to 10 words per level
  return levelWords;
};

// Legacy export for backward compatibility (will be filtered by level)
export const CHALLENGES: WordChallenge[] = ALL_WORDS;

