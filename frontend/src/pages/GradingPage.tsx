import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Save, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { examsService } from '../api/services/examsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export const GradingPage = () => {
  const queryClient = useQueryClient();
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [systemName, setSystemName] = useState('');
  
  const [activeSystem, setActiveSystem] = useState<any>(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdData, setThresholdData] = useState({
    grade: '',
    min_score: 0,
    max_score: 100,
    points: 0,
    remarks: ''
  });

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['grading-systems'],
    queryFn: () => examsService.getGradingSystems(),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const createSystemMutation = useMutation({
    mutationFn: (data: any) => examsService.createGradingSystem(data),
    onSuccess: () => {
      toast.success('Grading system created');
      setIsSystemModalOpen(false);
      setSystemName('');
      queryClient.invalidateQueries({ queryKey: ['grading-systems'] });
    }
  });

  const createThresholdMutation = useMutation({
    mutationFn: (data: any) => examsService.createThreshold(data),
    onSuccess: () => {
      toast.success('Threshold added');
      setIsThresholdModalOpen(false);
      setThresholdData({ grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' });
      queryClient.invalidateQueries({ queryKey: ['grading-systems'] });
    }
  });

  const deleteThresholdMutation = useMutation({
    mutationFn: (id: number) => examsService.deleteThreshold(id),
    onSuccess: () => {
      toast.success('Threshold removed');
      queryClient.invalidateQueries({ queryKey: ['grading-systems'] });
    }
  });

  const handleAddThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSystem) return;
    createThresholdMutation.mutate({
      ...thresholdData,
      grading_system: activeSystem.id
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight leading-none">Grading <span className="text-gradient">Systems</span></h1>
          <p className="text-muted text-xs sm:text-sm font-medium mt-2">Define how marks are converted to grades across your school.</p>
        </div>
        <Button onClick={() => setIsSystemModalOpen(true)} className="gap-2 w-full sm:w-auto">
          <Layers className="w-5 h-5" />
          New Grading System
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Systems List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-muted uppercase tracking-widest px-1">Available Systems</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-20 glass rounded-2xl animate-pulse" />)}
            </div>
          ) : systems.length === 0 ? (
            <div className="glass p-8 rounded-3xl border border-white/5 text-center">
              <p className="text-muted italic">No grading systems defined.</p>
            </div>
          ) : (
            systems.map((system: any) => (
              <div 
                key={system.id}
                onClick={() => setActiveSystem(system)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
                  activeSystem?.id === system.id 
                    ? 'glass-primary border-primary-500/50 shadow-lg shadow-primary-500/10' 
                    : 'glass border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-primary">{system.name}</h3>
                    <p className="text-xs text-muted mt-1">{system.thresholds?.length || 0} Grade Levels</p>
                  </div>
                  <Edit2 className={`w-4 h-4 transition-all ${
                    activeSystem?.id === system.id ? 'text-white opacity-100' : 'text-muted opacity-0 group-hover:opacity-100'
                  }`} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Thresholds View */}
        <div className="lg:col-span-2">
          {activeSystem ? (
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-primary">{activeSystem.name} Thresholds</h2>
                  <p className="text-xs sm:text-sm text-muted mt-0.5">Scores between min and max will be assigned the specified grade.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsThresholdModalOpen(true)} className="gap-2 bg-white/5 border-white/10 w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> Add Grade
                </Button>
              </div>
              <div className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-0">
                      <TableHead className="text-muted">Grade</TableHead>
                      <TableHead className="text-muted text-center">Score Range</TableHead>
                      <TableHead className="text-muted text-center">Points</TableHead>
                      <TableHead className="text-muted">Remarks</TableHead>
                      <TableHead className="text-right text-muted px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {activeSystem.thresholds?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted italic">
                          No grades added to this system yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...activeSystem.thresholds].sort((a,b) => b.min_score - a.min_score).map((t: any) => (
                        <TableRow key={t.id} className="hover:bg-white/5 border-white/5 transition-colors">
                          <TableCell className="font-black text-lg text-primary-400">{t.grade}</TableCell>
                          <TableCell className="text-center font-mono">
                            <span className="text-primary">{t.min_score}</span>
                            <span className="text-dim mx-2">—</span>
                            <span className="text-primary">{t.max_score}</span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-primary">{t.points}</TableCell>
                          <TableCell className="text-muted italic text-sm">{t.remarks}</TableCell>
                          <TableCell className="text-right px-8">
                            <button 
                              onClick={() => deleteThresholdMutation.mutate(t.id)}
                              className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] glass rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                <Layers className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Select a Grading System</h3>
              <p className="text-muted max-w-sm">
                Choose a grading system from the left to view and manage its grade thresholds.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New System Modal */}
      <Modal 
        isOpen={isSystemModalOpen} 
        onClose={() => setIsSystemModalOpen(false)} 
        title="New Grading System"
        className="max-w-md"
      >
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">System Name</label>
            <Input 
              placeholder="e.g. Standard 8-4-4, CBC, Cambridge" 
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 border-white/10" onClick={() => setIsSystemModalOpen(false)}>Cancel</Button>
            <Button className="flex-2" onClick={() => createSystemMutation.mutate({ name: systemName })} disabled={!systemName}>Create System</Button>
          </div>
        </div>
      </Modal>

      {/* New Threshold Modal */}
      <Modal 
        isOpen={isThresholdModalOpen} 
        onClose={() => setIsThresholdModalOpen(false)} 
        title="Add Grade Level"
        className="max-w-lg"
      >
        <form onSubmit={handleAddThreshold} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Grade (e.g. A)</label>
              <Input 
                required
                value={thresholdData.grade}
                onChange={(e) => setThresholdData({...thresholdData, grade: e.target.value.toUpperCase()})}
                className="bg-white/5 border-white/10 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Points</label>
              <Input 
                required
                type="number"
                value={thresholdData.points}
                onChange={(e) => setThresholdData({...thresholdData, points: parseInt(e.target.value)})}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Min Score</label>
              <Input 
                required
                type="number"
                value={thresholdData.min_score}
                onChange={(e) => setThresholdData({...thresholdData, min_score: parseInt(e.target.value)})}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Max Score</label>
              <Input 
                required
                type="number"
                value={thresholdData.max_score}
                onChange={(e) => setThresholdData({...thresholdData, max_score: parseInt(e.target.value)})}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium text-muted">Remarks</label>
              <Input 
                required
                placeholder="e.g. Excellent, Very Good"
                value={thresholdData.remarks}
                onChange={(e) => setThresholdData({...thresholdData, remarks: e.target.value})}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={() => setIsThresholdModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-[2] gap-2">
              <Save className="w-4 h-4" />
              Save Grade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
