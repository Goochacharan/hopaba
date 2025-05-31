
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguages } from '@/hooks/useLanguages';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  form: any;
  selectedLanguages: string[];
  onLanguageChange: (languages: string[]) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  form,
  selectedLanguages,
  onLanguageChange
}) => {
  const { data: languages, isLoading } = useLanguages();

  const handleLanguageToggle = (languageId: string, checked: boolean) => {
    let updatedLanguages;
    if (checked) {
      updatedLanguages = [...selectedLanguages, languageId];
    } else {
      updatedLanguages = selectedLanguages.filter(id => id !== languageId);
    }
    onLanguageChange(updatedLanguages);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading languages...</div>;
  }

  return (
    <FormField
      control={form.control}
      name="language_ids"
      render={() => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Languages Spoken
          </FormLabel>
          <FormDescription>
            Select the languages you can communicate in with customers
          </FormDescription>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {languages?.map((language) => (
              <FormItem
                key={language.id}
                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
              >
                <FormControl>
                  <Checkbox
                    checked={selectedLanguages.includes(language.id)}
                    onCheckedChange={(checked) => {
                      handleLanguageToggle(language.id, checked as boolean);
                    }}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer text-sm">
                  {language.name}
                </FormLabel>
              </FormItem>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default LanguageSelector;
