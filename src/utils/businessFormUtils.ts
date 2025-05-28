
export const validatePhoneNumber = (phone: string): boolean => {
  return phone.startsWith('+91') && phone.slice(3).replace(/\D/g, '').length === 10;
};

export const formatPhoneInput = (value: string): string => {
  if (!value.startsWith('+91')) {
    value = '+91' + value.replace('+91', '');
  }
  
  const digits = value.slice(3).replace(/\D/g, '');
  const limitedDigits = digits.slice(0, 10);
  
  return '+91' + limitedDigits;
};

export const parseBusinessHours = (hours?: string): { from: string; to: string } => {
  if (hours) {
    const hoursMatch = hours.match(/(\d+:\d+ [AP]M)\s*-\s*(\d+:\d+ [AP]M)/);
    if (hoursMatch) {
      return {
        from: hoursMatch[1],
        to: hoursMatch[2]
      };
    }
  }
  return { from: "9:00 AM", to: "5:00 PM" };
};

export const formatBusinessHours = (from: string, to: string): string => {
  return `${from} - ${to}`;
};

export const validateTags = (tags: string[]): boolean => {
  return tags && tags.length >= 3;
};

export const getCategoriesWithCustom = (): string[] => {
  const savedCategories = localStorage.getItem('customCategories');
  let customCategories: string[] = [];
  
  if (savedCategories) {
    try {
      customCategories = JSON.parse(savedCategories);
    } catch (error) {
      console.error('Error parsing custom categories:', error);
    }
  }
  
  const allCategories = [...Array.from(new Set([...customCategories]))];
  return Array.from(new Set(allCategories)).sort();
};

export const addCustomCategory = (category: string): string[] => {
  const savedCategories = localStorage.getItem('customCategories');
  let customCategories: string[] = [];
  
  try {
    if (savedCategories) {
      customCategories = JSON.parse(savedCategories);
    }
    
    if (!customCategories.includes(category)) {
      customCategories.push(category);
      localStorage.setItem('customCategories', JSON.stringify(customCategories));
    }
  } catch (error) {
    console.error('Error saving custom category:', error);
  }
  
  return getCategoriesWithCustom();
};
