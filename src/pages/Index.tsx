
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-10 px-4 md:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">YouTube Script Generator</h1>
          <p className="text-muted-foreground">
            Streamline your content creation process with AI-powered script generation
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <DashboardCard 
            title="Script Pipeline"
            description="Manage your script ideas and generation pipeline"
            link="/dashboard"
            count={8}
          />
          <DashboardCard 
            title="Channel Profiles"
            description="Manage your YouTube channel profiles and audience targeting"
            link="/channels"
            count={3}
          />
          <DashboardCard 
            title="URL Tracking"
            description="Track YouTube URLs for content research and analysis"
            link="/urls"
            count={12}
          />
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Script Ideas</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">
                View All
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ScriptIdeaCard 
              title="10 JavaScript Tips for Beginners"
              stage="Content Generated"
              channel="Code Masters"
              date="Today"
            />
            <ScriptIdeaCard 
              title="Building a React App from Scratch"
              stage="Idea Submitted"
              channel="Code Masters"
              date="Yesterday"
            />
            <ScriptIdeaCard 
              title="Python vs JavaScript - Which to Learn First?"
              stage="Content Reviewed"
              channel="Code Masters"
              date="2 days ago"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild className="flex items-center gap-2">
              <Link to="/dashboard">
                <PlusCircle className="w-4 h-4" /> Generate New Script Idea
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/channels">
                Add New Channel
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/urls">
                Track New URL
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ 
  title, 
  description, 
  link, 
  count 
}: { 
  title: string; 
  description: string; 
  link: string; 
  count: number 
}) => {
  return (
    <Link to={link} className="block">
      <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium text-lg">{title}</h3>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-sm font-medium">
            {count}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <span className="text-primary text-sm font-medium">View {title} →</span>
      </div>
    </Link>
  );
};

// Script Idea Card Component
const ScriptIdeaCard = ({ 
  title, 
  stage, 
  channel, 
  date 
}: { 
  title: string; 
  stage: string; 
  channel: string; 
  date: string 
}) => {
  // Determine badge color based on stage
  const getBadgeClass = () => {
    switch (stage) {
      case 'Idea Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Content Generated':
        return 'bg-amber-100 text-amber-800';
      case 'Content Reviewed':
        return 'bg-green-100 text-green-800';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
      <div className="mb-2">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getBadgeClass()}`}>
          {stage}
        </span>
      </div>
      <h3 className="font-medium mb-2 line-clamp-2">{title}</h3>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{channel}</span>
        <span>{date}</span>
      </div>
    </div>
  );
};

export default Index;
