'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientBaseUrl } from '@/lib/client-url';

// Validation schema
const pollFormSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .min(3, 'Question must be at least 3 characters')
    .max(200, 'Question must be less than 200 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  options: z
    .string()
    .min(1, 'Options are required')
    .refine((val) => {
      const lines = val.split('\n').map(s => s.trim()).filter(Boolean);
      return lines.length >= 2;
    }, 'You must provide at least 2 options')
    .refine((val) => {
      const lines = val.split('\n').map(s => s.trim()).filter(Boolean);
      return lines.every(line => line.length >= 1 && line.length <= 100);
    }, 'Each option must be between 1 and 100 characters')
});

type PollFormData = z.infer<typeof pollFormSchema>;

export default function PollForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: '',
      description: '',
      options: ''
    }
  });

  const onSubmit = async (data: PollFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const options = data.options
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const baseUrl = getClientBaseUrl();
      const res = await fetch(`${baseUrl}/api/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: data.question.trim(),
          description: data.description?.trim() || '',
          options
        }),
      });

      if (!res.ok) {
        let message = 'Failed to create poll';
        try {
          const errorData = await res.json();
          if (errorData?.error) message = errorData.error;
        } catch {}
        throw new Error(message);
      }

      // Reset form and redirect
      reset();
      router.push('/polls');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a new poll</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Question Field */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What do you want to ask?"
              {...register('question')}
              className={errors.question ? 'border-red-500' : ''}
            />
            {errors.question && (
              <p className="text-sm text-red-600">{errors.question.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Provide more context"
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Options Field */}
          <div className="space-y-2">
            <Label htmlFor="options">Options (one per line)</Label>
            <Textarea
              id="options"
              placeholder={'Option A\nOption B\nOption C'}
              {...register('options')}
              className={errors.options ? 'border-red-500' : ''}
              rows={4}
            />
            {errors.options && (
              <p className="text-sm text-red-600">{errors.options.message}</p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
