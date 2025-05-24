
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CaptchaVerification } from './CaptchaVerification';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isLoading: boolean;
  isDisabled: boolean;
  captchaToken: string | null;
  captchaSiteKey: string;
  onCaptchaVerify: (token: string) => void;
  requireCaptcha?: boolean; // Added this prop
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  isDisabled,
  captchaToken,
  captchaSiteKey,
  onCaptchaVerify,
  requireCaptcha = false, // Default to false
}) => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="your@email.com"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading || isDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading || isDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {requireCaptcha && (
          <CaptchaVerification 
            siteKey={captchaSiteKey} 
            onVerify={onCaptchaVerify} 
          />
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || isDisabled || (requireCaptcha && !captchaToken)}
        >
          {isLoading ? "Logging in..." : "Log in with Email"}
        </Button>
      </form>
    </Form>
  );
};
