/**
 * Threat Knowledge Base
 * Language-specific dictionaries for threat detection
 * 
 * Categories:
 * - violent_actions: Words indicating violence or harm
 * - weapons: References to weapons or explosives
 * - events: Attack-related events
 * - targets: Potential targets (military, police, infrastructure)
 * - urgency: Time-sensitive or urgent language
 */

export type ThreatCategory = 'violent_actions' | 'weapons' | 'events' | 'targets' | 'urgency';

export interface ThreatDictionary {
    violent_actions: string[];
    weapons: string[];
    events: string[];
    targets: string[];
    urgency: string[];
}

export const THREAT_DICTIONARIES: Record<string, ThreatDictionary> = {
    hindi: {
        violent_actions: [
            'मारना', 'हमला', 'धमाका', 'विस्फोट', 'हत्या',
            'मार', 'तोड़', 'नष्ट', 'खत्म', 'ध्वस्त',
            'आक्रमण', 'प्रहार', 'वार', 'गोली', 'फायर'
        ],
        weapons: [
            'बम', 'बंदूक', 'हथियार', 'गोला', 'विस्फोटक',
            'पिस्तौल', 'राइफल', 'ग्रेनेड', 'बारूद', 'गोली',
            'एके-47', 'आरडीएक्स', 'तोप', 'मिसाइल'
        ],
        events: [
            'विस्फोट', 'हमला', 'घटना', 'धमाका', 'आतंक',
            'हमले', 'ब्लास्ट', 'फायरिंग', 'गोलीबारी', 'संघर्ष',
            'युद्ध', 'लड़ाई', 'झड़प'
        ],
        targets: [
            'सेना', 'पुलिस', 'कैंप', 'थाना', 'चौकी',
            'बेस', 'स्टेशन', 'मुख्यालय', 'सरकार', 'मंत्री',
            'अधिकारी', 'जवान', 'सैनिक', 'फौज'
        ],
        urgency: [
            'अभी', 'जल्दी', 'तुरंत', 'फौरन', 'आज',
            'अब', 'शीघ्र', 'तत्काल', 'इसी वक्त'
        ]
    },

    urdu: {
        violent_actions: [
            'قتل', 'مار', 'حملہ', 'دھماکہ', 'تباہی',
            'ختم', 'توڑ', 'نقصان', 'ضرب', 'وار',
            'فائر', 'گولی', 'حملہ کرنا', 'مارنا'
        ],
        weapons: [
            'بم', 'بندوق', 'ہتھیار', 'گولہ', 'دھماکہ خیز',
            'پستول', 'رائفل', 'گرینیڈ', 'بارود', 'گولی',
            'اے کے 47', 'آر ڈی ایکس', 'توپ', 'میزائل'
        ],
        events: [
            'دھماکہ', 'حملہ', 'واقعہ', 'ہنگامہ', 'دہشت',
            'بلاسٹ', 'فائرنگ', 'گولی باری', 'تصادم',
            'جنگ', 'لڑائی', 'جھڑپ'
        ],
        targets: [
            'فوج', 'پولیس', 'کیمپ', 'تھانہ', 'چوکی',
            'بیس', 'اسٹیشن', 'ہیڈکوارٹر', 'حکومت', 'وزیر',
            'افسر', 'جوان', 'سپاہی', 'فوجی'
        ],
        urgency: [
            'ابھی', 'جلدی', 'فوری', 'فوراً', 'آج',
            'اب', 'تیزی سے', 'فی الفور', 'اسی وقت'
        ]
    },

    kashmiri: {
        violent_actions: [
            'مارُن', 'حملہ', 'دھماکہ', 'تباہی', 'ختم',
            'توڑ', 'نقصان', 'وار', 'فائر', 'گولی',
            'حملہ کرُن', 'مار ڈالُن'
        ],
        weapons: [
            'بم', 'بندوق', 'ہتھیار', 'گولہ', 'دھماکہ خیز',
            'پستول', 'رائفل', 'گرینیڈ', 'بارود', 'گولی',
            'اے کے', 'آر ڈی ایکس'
        ],
        events: [
            'دھماکہ', 'حملہ', 'واقعہ', 'ہنگامہ', 'دہشت',
            'بلاسٹ', 'فائرنگ', 'گولی باری', 'تصادم',
            'جنگ', 'لڑائی'
        ],
        targets: [
            'فوج', 'پولیس', 'کیمپ', 'تھانہ', 'چوکی',
            'بیس', 'اسٹیشن', 'حکومت', 'افسر', 'جوان',
            'سپاہی', 'فوجی'
        ],
        urgency: [
            'ابھی', 'جلدی', 'فوری', 'فوراً', 'آج',
            'اب', 'تیزی', 'اسی وقت'
        ]
    },

    english: {
        violent_actions: [
            'kill', 'attack', 'strike', 'assault', 'destroy',
            'eliminate', 'murder', 'shoot', 'fire', 'hit',
            'blow up', 'detonate', 'explode', 'raid', 'ambush',
            'target', 'neutralize', 'execute'
        ],
        weapons: [
            'bomb', 'gun', 'weapon', 'explosive', 'grenade',
            'pistol', 'rifle', 'ak-47', 'ak47', 'firearm',
            'ammunition', 'bullet', 'rdx', 'ied', 'missile',
            'rocket', 'launcher', 'artillery', 'mine'
        ],
        events: [
            'blast', 'explosion', 'attack', 'incident', 'strike',
            'bombing', 'shooting', 'firing', 'gunfire', 'clash',
            'encounter', 'operation', 'raid', 'ambush', 'assault',
            'terror', 'terrorism', 'militant'
        ],
        targets: [
            'army', 'military', 'police', 'camp', 'base',
            'station', 'post', 'checkpoint', 'headquarters', 'hq',
            'government', 'minister', 'officer', 'soldier', 'troop',
            'force', 'security', 'patrol', 'convoy'
        ],
        urgency: [
            'now', 'immediately', 'urgent', 'asap', 'today',
            'tonight', 'soon', 'quick', 'fast', 'hurry',
            'emergency', 'critical', 'priority'
        ]
    }
};

/**
 * Get threat dictionary for a language
 */
export function getThreatDictionary(language: string): ThreatDictionary {
    const normalizedLang = language.toLowerCase();
    return THREAT_DICTIONARIES[normalizedLang] || THREAT_DICTIONARIES.english;
}

/**
 * Get all categories
 */
export function getThreatCategories(): ThreatCategory[] {
    return ['violent_actions', 'weapons', 'events', 'targets', 'urgency'];
}

/**
 * Check if a word is in any threat category
 */
export function isThreateningWord(word: string, language: string): boolean {
    const dictionary = getThreatDictionary(language);
    const normalizedWord = word.toLowerCase().trim();

    for (const category of getThreatCategories()) {
        if (dictionary[category].some(w => w.toLowerCase() === normalizedWord)) {
            return true;
        }
    }

    return false;
}
