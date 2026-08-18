export interface AvatarPreset {
  id: string;
  name: string;
  category: 'Professional' | 'Creative' | 'Tech' | '3D & Illustrated';
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Professional / Executive
  {
    id: 'prof-1',
    name: 'Executive Leader (Male)',
    category: 'Professional',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'prof-2',
    name: 'Corporate Director (Female)',
    category: 'Professional',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'prof-3',
    name: 'Senior Architect (Male)',
    category: 'Professional',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'prof-4',
    name: 'Product Strategist (Female)',
    category: 'Professional',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'prof-5',
    name: 'Operations VP (Male)',
    category: 'Professional',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'prof-6',
    name: 'Managing Partner (Female)',
    category: 'Professional',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },

  // Tech & Engineering
  {
    id: 'tech-1',
    name: 'Lead Engineer (Female)',
    category: 'Tech',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'tech-2',
    name: 'Full-Stack Developer (Male)',
    category: 'Tech',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'tech-3',
    name: 'Cloud DevOps Specialist (Male)',
    category: 'Tech',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'tech-4',
    name: 'AI & Data Scientist (Female)',
    category: 'Tech',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },

  // Creative & Design
  {
    id: 'creat-1',
    name: 'UX/UI Designer (Female)',
    category: 'Creative',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'creat-2',
    name: 'Design Systems Lead (Male)',
    category: 'Creative',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'creat-3',
    name: 'Brand Specialist (Female)',
    category: 'Creative',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },

  // 3D & Modern Avatars
  {
    id: 'avatar-3d-1',
    name: 'Cyber Dolphin Teal',
    category: '3D & Illustrated',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'avatar-3d-2',
    name: 'Geometric Blue Wave',
    category: '3D & Illustrated',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'avatar-3d-3',
    name: 'Modern Glass Sphere',
    category: '3D & Illustrated',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'avatar-3d-4',
    name: 'Prism Horizon',
    category: '3D & Illustrated',
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

/**
 * Resizes and compresses an image file to a lightweight data URL (square 200x200, ~15kb)
 */
export async function processAvatarImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Center and crop to square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        // Convert to high-quality compressed JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
