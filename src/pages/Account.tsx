import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Camera, CreditCard, Key, Lock, LogOut, Mail, Upload, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
const Account: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    website: ''
  });
  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);
  const getProfile = async () => {
    try {
      setLoading(true);

      // Get profile data
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (error) {
        throw error;
      }
      if (data) {
        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          website: data.website || ''
        });
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };
  const handleSaveProfile = async () => {
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        website: profileData.website,
        updated_at: new Date().toISOString() // Convert Date to ISO string
      }).eq('id', user?.id);
      if (error) {
        throw error;
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    }
  };
  const handleChangePassword = () => {
    toast.success('Password updated successfully');
    // In a real app, we would handle actual password change logic here
  };
  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    try {
      // Create a unique file path for the avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;

      // Upload file to Supabase Storage
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true
      });
      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const {
        data: urlData
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const {
        error: updateError
      } = await supabase.from('profiles').update({
        avatar_url: avatarUrl
      }).eq('id', user.id);
      if (updateError) {
        throw updateError;
      }
      setAvatarUrl(avatarUrl);
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile image');
    } finally {
      setIsUploading(false);
    }
  };

  // Get full name or first letter of email as fallback
  const getFullName = () => {
    if (profileData.first_name || profileData.last_name) {
      return `${profileData.first_name} ${profileData.last_name}`.trim();
    }
    return '';
  };

  // Display the first letter of email or name as fallback
  const getInitials = () => {
    if (profileData.first_name) {
      return profileData.first_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };
  return <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mt-1">
          Manage your profile and application preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || ""} alt="User" />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              
              <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
                <span className="sr-only">Upload new avatar</span>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={isUploading} />
            </div>
            
            <h3 className="text-lg font-medium mt-4">{getFullName() || user?.email}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            
            <div className="w-full border-t my-6"></div>
            
            <div className="w-full space-y-1">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#profile">
                  <Mail className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#security">
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                
              </Button>
            </div>
            
            <div className="w-full border-t my-6"></div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to log in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card id="profile">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" value={profileData.first_name} onChange={e => setProfileData({
                  ...profileData,
                  first_name: e.target.value
                })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" value={profileData.last_name} onChange={e => setProfileData({
                  ...profileData,
                  last_name: e.target.value
                })} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>
              
              
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card id="security">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleChangePassword}>Update Password</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>;
};

// Helper component for checkboxes with labels and descriptions
const CheckboxField: React.FC<{
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}> = ({
  id,
  label,
  description,
  defaultChecked
}) => {
  return <div className="flex items-start space-x-3">
      <Checkbox id={id} defaultChecked={defaultChecked} />
      <div>
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>;
};

// Import the missing components
import { Bell, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export default Account;