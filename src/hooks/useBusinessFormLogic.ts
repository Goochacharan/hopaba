
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BusinessFormValues, businessSchema } from '@/components/business/BusinessForm';
import { Business } from '@/components/business/BusinessForm';
import { parseBusinessHours } from '@/utils/businessFormUtils';

export const useBusinessFormLogic = (business?: Business) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(business?.availability_days || []);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { from: defaultHoursFrom, to: defaultHoursTo } = useMemo(() => 
    parseBusinessHours(business?.hours), [business?.hours]
  );

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: useMemo(() => ({
      name: business?.name || "",
      category: business?.category || "",
      subcategory: business?.subcategory || [],
      description: business?.description || "",
      area: business?.area || "",
      city: business?.city || "",
      address: business?.address || "",
      postal_code: business?.postal_code || "",
      contact_phone: business?.contact_phone || "+91",
      whatsapp: business?.whatsapp || "+91",
      contact_email: business?.contact_email || "",
      website: business?.website || "",
      instagram: business?.instagram || "",
      price_range_min: business?.price_range_min,
      price_range_max: business?.price_range_max,
      price_unit: business?.price_unit || "per hour",
      map_link: business?.map_link || "",
      tags: business?.tags || [],
      experience: business?.experience || "",
      availability: business?.availability || "",
      hours_from: defaultHoursFrom,
      hours_to: defaultHoursTo,
      availability_days: business?.availability_days || [],
      images: business?.images || [],
      languages: business?.languages || [],
    }), [business, defaultHoursFrom, defaultHoursTo]),
  });

  const handleDayToggle = (day: string, checked: boolean) => {
    let updatedDays = [...selectedDays];
    
    if (checked) {
      if (!updatedDays.includes(day)) {
        updatedDays.push(day);
      }
    } else {
      updatedDays = updatedDays.filter(d => d !== day);
    }
    
    setSelectedDays(updatedDays);
    form.setValue("availability_days", updatedDays, { shouldValidate: true });
    form.setValue("availability", updatedDays.join(', '), { shouldValidate: true });
  };

  useEffect(() => {
    if (business?.availability_days && business.availability_days.length > 0) {
      setSelectedDays(business.availability_days);
      form.setValue("availability_days", business.availability_days);
    }
  }, [business, form]);

  return {
    form,
    selectedDays,
    selectedCategoryId,
    setSelectedCategoryId,
    handleDayToggle
  };
};
