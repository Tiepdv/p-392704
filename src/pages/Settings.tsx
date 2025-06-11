import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, User, Check, X, Eye, EyeOff } from "lucide-react";

interface ColumnVisibilitySettings {
  id?: string;
  role: string;
  tab: string;
  hidden_columns: string[];
}

interface TabVisibilitySettings {
  id?: string;
  role: string;
  hidden_tabs: string[];
}

const Settings = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [marketLinesColumns, setMarketLinesColumns] = useState<string[]>([]);
  const [libraryColumns, setLibraryColumns] = useState<string[]>([]);
  const [exploreColumns, setExploreColumns] = useState<string[]>([]);
  const [viewerSettings, setViewerSettings] = useState<ColumnVisibilitySettings[]>([]);
  const [viewerTabSettings, setViewerTabSettings] = useState<TabVisibilitySettings>({
    role: 'viewer',
    hidden_tabs: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Available tabs that can be controlled
  const availableTabs = [
    { id: 'market-lines', name: 'Market Lines' },
    { id: 'library', name: 'Library' },
    { id: 'my-library', name: 'SH Sellers.json' },
    { id: 'explore', name: 'Explore' }
  ];

  // Sample columns for Market Lines (these would normally come from actual data)
  const sampleMarketLinesColumns = [
     "Line", "Key","BU","Score","Score","Priority_Weight","Revenue","OMP_rev","PMP_rev","RES_rev","Revenue_all",
    "BidOpp","OMP_bidopp","PMP_bidopp","RES_bidopp","BidOpp_all","RPMO","Primary_Line","SELLER DOMAIN","SELLER NAME","SELLER TYPE"];

  // Sample columns for Library (these would normally come from actual data)
  const sampleLibraryColumns = [
    "Line", "Type", "Primary_Line", "Priority_Weight", "Account", 
    "demand_partner", "demand_market_division", "ID", "SELLER DOMAIN", "SELLER NAME","SELLER TYPE"];

  // Use the same columns as Market Lines for Explore
  const sampleExploreColumns = [
     "Line", "Key","BU","Score","Score","Priority_Weight","Revenue","OMP_rev","PMP_rev","RES_rev","Revenue_all",
    "BidOpp","OMP_bidopp","PMP_bidopp","RES_bidopp","BidOpp_all","RPMO","Primary_Line","SELLER DOMAIN","SELLER NAME","SELLER TYPE"];

  useEffect(() => {
    setMarketLinesColumns(sampleMarketLinesColumns);
    setLibraryColumns(sampleLibraryColumns);
    setExploreColumns(sampleExploreColumns);
    fetchUsers();
    fetchSettings();
    fetchTabSettings();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching all users from profiles table...');
      
      // First try to get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // If there's an error, try to get users from auth (requires admin privileges)
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
          toast({
            title: "Error",
            description: "Failed to fetch user list. You may need admin privileges.",
            variant: "destructive",
          });
          return;
        }

        if (authUsers) {
          console.log('Found auth users:', authUsers);
          const convertedUsers = authUsers.map(user => ({
            id: user.id,
            email: user.email || '',
            role: 'viewer' as const,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
            name: user.user_metadata?.name || null,
            full_name: user.user_metadata?.full_name || null
          }));
          setUsers(convertedUsers);
        }
        return;
      }

      console.log('Fetched profiles:', profilesData);
      
      if (profilesData && profilesData.length > 0) {
        setUsers(profilesData as Profile[]);
      } else {
        console.log('No profiles found, trying to get users from auth.users...');
        
        // If no profiles found, try to sync with auth.users
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
          toast({
            title: "Warning",
            description: "No user profiles found. Users may need to log in to create profiles.",
            variant: "destructive",
          });
        } else if (authUsers && authUsers.length > 0) {
          console.log('Found auth users, creating profiles:', authUsers);
          
          // Create missing profiles for existing auth users
          const missingProfiles = authUsers.map(user => ({
            id: user.id,
            email: user.email || '',
            role: 'viewer' as const
          }));

          const { data: insertedProfiles, error: insertError } = await supabase
            .from('profiles')
            .upsert(missingProfiles, { onConflict: 'id' })
            .select('*');

          if (insertError) {
            console.error('Error creating profiles:', insertError);
          } else {
            console.log('Created profiles:', insertedProfiles);
            setUsers(insertedProfiles as Profile[]);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('column_visibility_settings')
        .select('*')
        .eq('role', 'viewer');

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      setViewerSettings(data || []);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchTabSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tab_visibility_settings')
        .select('*')
        .eq('role', 'viewer')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching tab settings:", error);
        return;
      }

      if (data) {
        setViewerTabSettings({
          id: data.id,
          role: data.role,
          hidden_tabs: data.hidden_tabs || []
        });
      }
    } catch (error: any) {
      console.error("Error fetching tab settings:", error);
    }
  };

  const toggleRole = async (user: Profile) => {
    try {
      const newRole = user.role === 'admin' ? 'viewer' : 'admin';
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      ));
      
      toast({
        title: "Role updated",
        description: `User ${user.email} is now a ${newRole}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getHiddenColumns = (tab: string): string[] => {
    const setting = viewerSettings.find(s => s.tab === tab);
    return setting?.hidden_columns || [];
  };

  const updateColumnVisibility = (tab: string, column: string, isHidden: boolean) => {
    const existingSettingIndex = viewerSettings.findIndex(s => s.tab === tab);
    
    if (existingSettingIndex >= 0) {
      const updatedSettings = [...viewerSettings];
      const hiddenColumns = updatedSettings[existingSettingIndex].hidden_columns;
      
      if (isHidden) {
        if (!hiddenColumns.includes(column)) {
          hiddenColumns.push(column);
        }
      } else {
        const index = hiddenColumns.indexOf(column);
        if (index > -1) {
          hiddenColumns.splice(index, 1);
        }
      }
      
      setViewerSettings(updatedSettings);
    } else {
      // Create new setting
      const newSetting: ColumnVisibilitySettings = {
        role: 'viewer',
        tab: tab,
        hidden_columns: isHidden ? [column] : []
      };
      setViewerSettings([...viewerSettings, newSetting]);
    }
  };

  const updateTabVisibility = (tabId: string, isHidden: boolean) => {
    const updatedHiddenTabs = [...viewerTabSettings.hidden_tabs];
    
    if (isHidden) {
      if (!updatedHiddenTabs.includes(tabId)) {
        updatedHiddenTabs.push(tabId);
      }
    } else {
      const index = updatedHiddenTabs.indexOf(tabId);
      if (index > -1) {
        updatedHiddenTabs.splice(index, 1);
      }
    }
    
    setViewerTabSettings({
      ...viewerTabSettings,
      hidden_tabs: updatedHiddenTabs
    });
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Save column visibility settings
      await supabase
        .from('column_visibility_settings')
        .delete()
        .eq('role', 'viewer');

      const columnSettingsToInsert = viewerSettings.map(setting => ({
        role: setting.role,
        tab: setting.tab,
        hidden_columns: setting.hidden_columns
      }));

      if (columnSettingsToInsert.length > 0) {
        const { error: columnError } = await supabase
          .from('column_visibility_settings')
          .insert(columnSettingsToInsert);

        if (columnError) {
          throw columnError;
        }
      }

      // Save tab visibility settings
      await supabase
        .from('tab_visibility_settings')
        .delete()
        .eq('role', 'viewer');

      const { error: tabError } = await supabase
        .from('tab_visibility_settings')
        .insert({
          role: viewerTabSettings.role,
          hidden_tabs: viewerTabSettings.hidden_tabs
        });

      if (tabError) {
        throw tabError;
      }

      toast({
        title: "Settings saved",
        description: "Column and tab visibility settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderColumnToggles = (columns: string[], tab: string) => {
    const hiddenColumns = getHiddenColumns(tab);
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column} className="flex items-center space-x-2">
            <Switch
              id={`${tab}-${column}`}
              checked={hiddenColumns.includes(column)}
              onCheckedChange={(checked) => updateColumnVisibility(tab, column, checked)}
            />
            <Label htmlFor={`${tab}-${column}`} className="text-sm">
              Hide "{column}"
            </Label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* User Management Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.name || user.full_name || "—"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRole(user)}
                            className="w-full flex items-center justify-center gap-1"
                          >
                            {user.role === 'admin' ? (
                              <>
                                <X className="h-3 w-3" />
                                <span>Remove Admin</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Make Admin</span>
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Visibility Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Tab Visibility Settings for Viewer Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configure which tabs should be hidden for users with the "viewer" role.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {availableTabs.map((tab) => (
                <div key={tab.id} className="flex items-center space-x-2">
                  <Switch
                    id={`tab-${tab.id}`}
                    checked={viewerTabSettings.hidden_tabs.includes(tab.id)}
                    onCheckedChange={(checked) => updateTabVisibility(tab.id, checked)}
                  />
                  <Label htmlFor={`tab-${tab.id}`} className="text-sm">
                    Hide "{tab.name}"
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Column Visibility Settings for Viewer Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configure which columns should be hidden for users with the "viewer" role in different tabs.
            </p>
            
            <Tabs defaultValue="market-lines" className="w-full">
              <TabsList>
                <TabsTrigger value="market-lines">Market Lines</TabsTrigger>
                <TabsTrigger value="library">Library</TabsTrigger>
                <TabsTrigger value="explore">Explore</TabsTrigger>
              </TabsList>
              
              <TabsContent value="market-lines" className="space-y-4">
                <h3 className="text-lg font-medium">Market Lines Tab Columns</h3>
                {renderColumnToggles(marketLinesColumns, 'market-lines')}
              </TabsContent>
              
              <TabsContent value="library" className="space-y-4">
                <h3 className="text-lg font-medium">Library Tab Columns</h3>
                {renderColumnToggles(libraryColumns, 'library')}
              </TabsContent>
              
              <TabsContent value="explore" className="space-y-4">
                <h3 className="text-lg font-medium">Explore Tab Columns</h3>
                {renderColumnToggles(exploreColumns, 'explore')}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end pt-4">
              <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
