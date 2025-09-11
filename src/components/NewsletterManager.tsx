import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewsletterDashboard from '@/components/newsletter/NewsletterDashboard';
import SubscriberList from '@/components/newsletter/SubscriberList';
import CampaignManager from '@/components/newsletter/CampaignManager';
import NewsletterSettings from '@/components/newsletter/NewsletterSettings';

const NewsletterManager = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="subscribers">Inscritos</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <NewsletterDashboard />
        </TabsContent>

        <TabsContent value="subscribers">
          <SubscriberList />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="settings">
          <NewsletterSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsletterManager;