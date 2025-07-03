
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Mail, Phone, User, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

{/*
const teamMembers = [
  {
    id: 1,
    name: "Andrea De Filippo",
    position: "VP Global Operations & Programmatic",
    email: "andrea.defilippo@showheroes-group.com",
  },
  {
    id: 2,
    name: "Hannes Meering",
    position: "VP Global Ad Operations",
    email: "hannes.meering@showheroes-group.com",
  },
  {
    id: 3,
    name: "Emre Aylanç",
    position: "Senior Yield Optimization Manager",
    email: "emre.aylanc@showheroes-group.com",
  },
  {
    id: 4,
    name: "Van Tiep Do",
    position: "Data Analyst",
    email: "van.tiep.do@showheroes-group.com",
  },
]; 
*/}
const teamMembers = [
  {
    id: 1,
    name: "BI Team",
    position: "Showheroes Group",
    email: "bi@showheroes-group.com",
  },
]; 


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
  recipient: z.string().email({ message: "Please select a recipient." }),
});

type FormValues = z.infer<typeof formSchema>;

const Contact = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      recipient: "",
    },
  });

  const handleMemberClick = (email: string) => {
    setSelectedMember(email);
    form.setValue("recipient", email);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // This is where you would integrate with an email sending service
      // For now, we'll just simulate a successful submission
      console.log("Form data:", data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${data.recipient}.`,
      });
      
      form.reset();
      setSelectedMember(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {teamMembers.map((member) => (
          <Card 
            key={member.id} 
            className={`cursor-pointer transition-all ${
              selectedMember === member.email ? "border-primary shadow-md" : ""
            }`}
            onClick={() => handleMemberClick(member.email)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {member.name}
              </CardTitle>
              <CardDescription>{member.position}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">+** **********</span>
                </div>
              </div>
            </CardContent>
            {selectedMember === member.email && (
              <div className="absolute top-0 right-0 bg-primary text-white p-2 rounded-bl-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </Card>
        ))}
      </div>
  
      
      {/*
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
            <CardDescription>
              {selectedMember 
                ? `Send a message to ${teamMembers.find(m => m.email === selectedMember)?.name}` 
                : "Select a team member above and send them a message"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>Your Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient</FormLabel>
                      <FormControl>
                        <Input 
                          readOnly 
                          value={field.value || "Select a team member above"}
                          className={!field.value ? "text-muted-foreground bg-muted" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Subject of your message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your message..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || !selectedMember}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      */}
    </div>
  );
};

export default Contact;
