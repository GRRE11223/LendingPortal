import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

export type AgentFormData = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
  onSubmit: (data: AgentFormData) => void;
  onCancel: () => void;
  brokerName?: string;
}

export function AgentForm({ onSubmit, onCancel, brokerName }: AgentFormProps) {
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      email: '',
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {brokerName && (
          <div className="text-sm text-muted-foreground pb-4 border-b">
            Adding team member to <span className="font-medium text-foreground">{brokerName}</span>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Name</FormLabel>
              <FormDescription>
                Enter the full name of the team member
              </FormDescription>
              <FormControl>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    {...field} 
                    className="pl-9" 
                    placeholder="John Doe"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Email</FormLabel>
              <FormDescription>
                The invitation will be sent to this email address
              </FormDescription>
              <FormControl>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    {...field} 
                    type="email" 
                    className="pl-9"
                    placeholder="john@example.com"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="min-w-[100px]"
          >
            Add Member
          </Button>
        </div>
      </form>
    </Form>
  );
} 