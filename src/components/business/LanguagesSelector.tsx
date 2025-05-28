
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useFormContext } from 'react-hook-form';

const INDIAN_LANGUAGES = [
  'Hindi',
  'English', 
  'Bengali',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Urdu',
  'Malayalam',
  'Kannada',
  'Marathi',
  'Punjabi',
  'Assamese',
  'Odia',
  'Sanskrit',
  'Konkani',
  'Manipuri',
  'Nepali',
  'Bodo',
  'Dogri',
  'Kashmiri',
  'Maithili',
  'Santali',
  'Sindhi',
  'Rajasthani',
  'Bhojpuri',
  'Haryanvi',
  'Chhattisgarhi',
  'Goan Konkani',
  'Tulu',
  'Kodava'
].sort();

interface LanguagesSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

const LanguagesSelector: React.FC<LanguagesSelectorProps> = ({
  selectedLanguages,
  onLanguagesChange
}) => {
  const { control } = useFormContext();

  const handleLanguageToggle = (language: string, checked: boolean) => {
    let updatedLanguages = [...selectedLanguages];
    
    if (checked) {
      if (!updatedLanguages.includes(language)) {
        updatedLanguages.push(language);
      }
    } else {
      updatedLanguages = updatedLanguages.filter(lang => lang !== language);
    }
    
    onLanguagesChange(updatedLanguages);
  };

  const removeLanguage = (languageToRemove: string) => {
    const updatedLanguages = selectedLanguages.filter(lang => lang !== languageToRemove);
    onLanguagesChange(updatedLanguages);
  };

  return (
    <FormField
      control={control}
      name="languages"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Languages Spoken</FormLabel>
          <FormControl>
            <div className="space-y-4">
              {/* Selected Languages Display */}
              {selectedLanguages.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Selected Languages:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLanguages.map((language) => (
                      <Badge key={language} variant="secondary" className="px-2 py-1">
                        {language}
                        <button
                          type="button"
                          className="ml-1 h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => removeLanguage(language)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Language Selection Grid */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Select languages you speak:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {INDIAN_LANGUAGES.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language}`}
                        checked={selectedLanguages.includes(language)}
                        onCheckedChange={(checked) => 
                          handleLanguageToggle(language, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`language-${language}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {language}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default LanguagesSelector;
