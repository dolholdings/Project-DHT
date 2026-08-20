export interface CompanyDomainConfig {
  domain: string;
  companyName: string;
  code: string;
  logo: string;
}

export const COMPANY_DOMAIN_MAPPINGS: Record<string, CompanyDomainConfig> = {
  'dolcool.ae': {
    domain: 'dolcool.ae',
    companyName: 'DRCS SHJ',
    code: 'DRCS',
    logo: '❄️'
  },
  'dolrad.ae': {
    domain: 'dolrad.ae',
    companyName: 'DML',
    code: 'DML',
    logo: '⚡'
  },
  'dolheat.ae': {
    domain: 'dolheat.ae',
    companyName: 'DHT-Ajman',
    code: 'DHT',
    logo: '🔥'
  },
  'dolphingroup.ae': {
    domain: 'dolphingroup.ae',
    companyName: 'Corporate',
    code: 'CORP',
    logo: '🏢'
  },
  'dghanalytics.com': {
    domain: 'dghanalytics.com',
    companyName: 'DGH Analytics',
    code: 'DGHA',
    logo: '📊'
  },
  'p.dghanalytics.com': {
    domain: 'p.dghanalytics.com',
    companyName: 'DGH Analytics Portal',
    code: 'DGHA',
    logo: '🚀'
  }
};

export const getCompanyByDomain = (domain: string): CompanyDomainConfig | null => {
  if (!domain) return null;
  const cleanDomain = domain.toLowerCase().trim().replace(/^@/, '');
  return COMPANY_DOMAIN_MAPPINGS[cleanDomain] || null;
};

export const getCompanyByEmail = (email: string): CompanyDomainConfig | null => {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1];
  return getCompanyByDomain(domain);
};

// ==========================================
// PASSWORD COMPLEXITY & SECURITY POLICY
// ==========================================

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 64,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialCharsRegex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
  bannedPatterns: [
    'password',
    '12345678',
    '123456789',
    'qwertyuiop',
    'admin123',
    'dolphin123',
    'welcome123'
  ]
};

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  notTrivial: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  strengthColor: string;
  strengthPercent: number;
  errors: string[];
  requirements: PasswordRequirements;
}

export const checkPasswordRequirements = (pwd: string): PasswordRequirements => {
  const normalized = (pwd || '').trim();
  const lower = normalized.toLowerCase();
  const isTrivial = PASSWORD_POLICY.bannedPatterns.some((pattern) => lower === pattern || lower === pattern + '!');

  return {
    minLength: normalized.length >= PASSWORD_POLICY.minLength,
    hasUppercase: /[A-Z]/.test(normalized),
    hasLowercase: /[a-z]/.test(normalized),
    hasNumber: /[0-9]/.test(normalized),
    hasSpecialChar: PASSWORD_POLICY.specialCharsRegex.test(normalized),
    notTrivial: !isTrivial && normalized.length > 0
  };
};

export const getPasswordStrengthScore = (
  reqs: PasswordRequirements
): { score: number; label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong'; color: string; percent: number } => {
  const metCount = [
    reqs.minLength,
    reqs.hasUppercase,
    reqs.hasLowercase,
    reqs.hasNumber,
    reqs.hasSpecialChar,
    reqs.notTrivial
  ].filter(Boolean).length;

  if (metCount <= 1) return { score: 0, label: 'Very Weak', color: 'bg-rose-500 text-rose-500', percent: 15 };
  if (metCount <= 3) return { score: 1, label: 'Weak', color: 'bg-amber-500 text-amber-500', percent: 40 };
  if (metCount <= 5) return { score: 2, label: 'Medium', color: 'bg-blue-500 text-blue-500', percent: 70 };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500 text-emerald-500', percent: 100 };
};

export const validatePasswordPolicy = (password: string): PasswordValidationResult => {
  const reqs = checkPasswordRequirements(password);
  const strength = getPasswordStrengthScore(reqs);
  const errors: string[] = [];

  if (!reqs.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long.`);
  }
  if (!reqs.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }
  if (!reqs.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }
  if (!reqs.hasNumber) {
    errors.push('Password must contain at least one numeric digit (0-9).');
  }
  if (!reqs.hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*).');
  }
  if (!reqs.notTrivial) {
    errors.push('Password contains an easily guessable or common pattern. Please use a unique phrase.');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    score: strength.score,
    strengthLabel: strength.label,
    strengthColor: strength.color,
    strengthPercent: strength.percent,
    errors,
    requirements: reqs
  };
};

export const generateSecureCompliantPassword = (prefix = 'Dolphin'): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*+=-_';

  const pickRandom = (set: string) => set.charAt(Math.floor(Math.random() * set.length));

  const year = 2026 + Math.floor(Math.random() * 50);
  const randomChar1 = pickRandom(upper);
  const randomChar2 = pickRandom(lower);
  const randomDigit = pickRandom(digits);
  const randomSymbol = pickRandom(symbols);

  return `${prefix}@${randomChar1}${randomChar2}${year}${randomDigit}${randomSymbol}`;
};

