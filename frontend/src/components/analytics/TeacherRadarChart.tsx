import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

interface Props {
  data: {
    subject: string;
    score: number;
    fullMark: number;
  }[];
}

export const TeacherRadarChart = ({ data }: Props) => {
  return (
    <div className="glass p-10 rounded-[48px] border border-white/5 h-full">
      <h3 className="text-2xl font-black text-white mb-2">Teacher Effectiveness</h3>
      <p className="text-primary-200/40 text-sm mb-10">Cross-dimensional performance metrics</p>
      
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#ffffff10" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Teacher"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#6366f1"
              fillOpacity={0.5}
              animationDuration={2000}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
