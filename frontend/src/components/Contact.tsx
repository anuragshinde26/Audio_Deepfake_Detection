import { Mail, Phone, User } from "lucide-react";
import { Card } from "@/components/ui/card";

const teamMembers = [
  {
    name: "Anurag Shinde",
    phone: "+91 8080946631",
    email: "anuragshinde2603@gmail.com"
  },
  {
    name: "Ansh Zanzad",
    phone: "+91 9960871127",
    email: "officialanshzanzad@gmail.com"
  },
  {
    name: "Dev Ojha",
    phone: "+91 6354119109",
    email: "devprasad6007@gmail.com"
  }
];

export const Contact = () => {
  return (
    <section className="py-20 px-4" id="contact">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Contact Us
          </h2>
          <p className="text-muted-foreground text-lg">
            Get in touch with our team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {teamMembers.map((member, idx) => (
            <Card key={idx} className="glass-effect p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-xl mb-4">{member.name}</h3>
                  
                  <div className="space-y-3 text-sm">
                    <a 
                      href={`tel:${member.phone}`}
                      className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </a>
                    
                    <a 
                      href={`mailto:${member.email}`}
                      className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors break-all"
                    >
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
