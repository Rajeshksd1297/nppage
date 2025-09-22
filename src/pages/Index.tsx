import { DemoSetup } from '@/components/DemoSetup';

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">AuthorPage Platform</h1>
          <p className="text-xl text-muted-foreground">Author & Academic Landing Page Platform</p>
        </div>
        
        <DemoSetup />
      </div>
    </div>
  );
};

export default Index;
