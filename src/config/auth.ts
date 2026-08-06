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
