
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CaptchaVerification } from './CaptchaVerification';

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void;
  isLoading: boolean;
  isDisabled: boolean;
  captchaToken: string | null;
  captchaSiteKey: string;
  onCaptchaVerify: (token: string) => void;
  requireCaptcha?: boolean;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  isLoading,
  isDisabled,
  captchaToken,
  captchaSiteKey,
  onCaptchaVerify,
  requireCaptcha = true,
}) => {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
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
                  autoComplete="new-password"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
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
          className="w-full mt-4" 
          disabled={isLoading || isDisabled || (requireCaptcha && !captchaToken)}
        >
          {isLoading ? "Creating account..." : "Sign up with Email"}
        </Button>
      </form>
    </Form>
  );
};
