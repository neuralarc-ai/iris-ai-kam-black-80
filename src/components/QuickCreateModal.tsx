
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FolderOpen, MessageSquare, Users } from 'lucide-react';
import CreateAccountModal from './modals/CreateAccountModal';
import CreateProjectModal from './modals/CreateProjectModal';
import CreateUpdateModal from './modals/CreateUpdateModal';

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemCreated: () => void;
}

const QuickCreateModal = ({ open, onOpenChange, onItemCreated }: QuickCreateModalProps) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleItemCreated = () => {
    setActiveModal(null);
    onOpenChange(false);
    onItemCreated();
  };

  const quickCreateOptions = [
    {
      id: 'account',
      title: 'New Account',
      description: 'Create a new customer account',
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      id: 'project',
      title: 'New Project',
      description: 'Start a new project or opportunity',
      icon: FolderOpen,
      color: 'bg-green-500',
    },
    {
      id: 'update',
      title: 'New Update',
      description: 'Add an update to a project',
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
  ];

  return (
    <>
      <Dialog open={open && !activeModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Create</DialogTitle>
            <DialogDescription>
              Choose what you'd like to create.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {quickCreateOptions.map((option) => (
              <Card 
                key={option.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                onClick={() => setActiveModal(option.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${option.color}`}>
                      <option.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <CreateAccountModal
        open={activeModal === 'account'}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onAccountCreated={handleItemCreated}
      />

      <CreateProjectModal
        open={activeModal === 'project'}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onProjectCreated={handleItemCreated}
      />

      <CreateUpdateModal
        open={activeModal === 'update'}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onUpdateCreated={handleItemCreated}
      />
    </>
  );
};

export default QuickCreateModal;
