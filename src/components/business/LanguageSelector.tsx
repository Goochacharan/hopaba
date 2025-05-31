
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguages } from '@/hooks/useLanguages';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  form: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ form }) => {
  const { data: languages, isLoading } = useLanguages();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading languages...</div>;
  }

  return (
    <FormField
      control={form.control}
      name="language_ids"
      render={({ field }) => (
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
                    checked={field.value?.includes(language.id) || false}
                    onCheckedChange={(checked) => {
                      const currentValue = field.value || [];
                      if (checked) {
                        field.onChange([...currentValue, language.id]);
                      } else {
                        field.onChange(currentValue.filter((id: string) => id !== language.id));
                      }
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
