import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Save, X, HelpCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { lmsService } from "../../api/services/lmsService";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { classesService } from "../../api/services/classesService";

interface QuestionDraft {
  text: string;
  question_type: "MCQ" | "TEXT";
  points: number;
  options: string[];
  correct_answer: string;
}

interface QuizBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const QuizBuilder = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: QuizBuilderProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    subject: initialData?.subject || "",
    stream: initialData?.stream || "",
    duration_minutes: initialData?.duration_minutes || 30,
    questions: (initialData?.questions || [
      {
        text: "",
        question_type: "MCQ",
        points: 1,
        options: ["", ""],
        correct_answer: "0",
      },
    ]) as QuestionDraft[],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const data = await classesService.getSubjects();
      return data.results || data;
    },
    enabled: isOpen,
  });

  const { data: streamsData } = useQuery({
    queryKey: ["streams"],
    queryFn: classesService.getStreams,
    enabled: isOpen,
  });
  const streams = Array.isArray(streamsData)
    ? streamsData
    : (streamsData as any)?.results || [];

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          text: "",
          question_type: "MCQ",
          points: 1,
          options: ["", ""],
          correct_answer: "0",
        },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push("");
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    // Adjust correct answer if it was the removed one
    if (newQuestions[qIndex].correct_answer === String(oIndex)) {
      newQuestions[qIndex].correct_answer = "0";
    } else if (parseInt(newQuestions[qIndex].correct_answer) > oIndex) {
      newQuestions[qIndex].correct_answer = String(
        parseInt(newQuestions[qIndex].correct_answer) - 1,
      );
    }
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject) return toast.error("Please select a subject");
    if (formData.questions.length === 0)
      return toast.error("Please add at least one question");

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        stream: formData.stream ? parseInt(formData.stream) : null,
      };
      if (initialData?.id) {
        await lmsService.updateQuiz(initialData.id, payload);
        toast.success("Quiz updated successfully");
      } else {
        await lmsService.createQuiz(payload);
        toast.success("New quiz created successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Quiz" : "Create New Quiz"}
      description="Create practice quiz questions, choices, and set the duration."
      className="max-w-4xl glass border-white/10"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-10 mt-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar"
      >
        {/* Meta Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 rounded-[32px] bg-white/5 border border-white/5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest ml-1">
                Quiz Title
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                placeholder="e.g. Advanced Thermodynamics Final"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest ml-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full h-28 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-amber-500 transition-all resize-none"
                placeholder="Guidelines for students..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <Select
              label="Select Subject"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
            >
              <option value="" className="bg-bg-color">
                Select Subject...
              </option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.name}
                </option>
              ))}
            </Select>

            <Select
              label="Assign to Stream"
              value={formData.stream}
              onChange={(e) =>
                setFormData({ ...formData, stream: e.target.value })
              }
            >
              <option value="" className="bg-bg-color">
                All Classes (no stream)
              </option>
              {streams.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.grade_level_name ? `${s.grade_level_name} - ${s.name}` : s.name}
                </option>
              ))}
            </Select>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest ml-1">
                Duration (Minutes)
              </label>
              <input
                required
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <HelpCircle className="text-amber-500" />
              Questions
            </h3>
            <Button
              type="button"
              onClick={addQuestion}
              variant="outline"
              className="gap-2 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl text-[10px] font-black uppercase w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          <div className="space-y-6">
            {formData.questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative group hover:border-white/10 transition-all"
              >
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-6 right-6 p-2 text-white/20 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs">
                      {qIndex + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                        Question Text
                      </label>
                      <input
                        required
                        type="text"
                        value={q.text}
                        onChange={(e) =>
                          updateQuestion(qIndex, { text: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-white/10 py-2 text-white font-bold outline-none focus:border-amber-500 transition-all"
                        placeholder="Enter the question here..."
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                        Points
                      </label>
                      <input
                        required
                        type="number"
                        value={q.points}
                        onChange={(e) =>
                          updateQuestion(qIndex, {
                            points: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-transparent border-b border-white/10 py-2 text-white font-bold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 ml-12">
                    <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest flex items-center justify-between">
                      Answer Choices
                      <span className="text-[9px] text-amber-500/50">
                        Mark the correct answer using the round selector
                      </span>
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options.map((opt, oIndex) => (
                        <div
                          key={oIndex}
                          className="flex items-center gap-4 group/opt"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(qIndex, {
                                correct_answer: String(oIndex),
                              })
                            }
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              q.correct_answer === String(oIndex)
                                ? "border-emerald-500 bg-emerald-500/20"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            {q.correct_answer === String(oIndex) && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                          <input
                            required
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[oIndex] = e.target.value;
                              updateQuestion(qIndex, { options: newOpts });
                            }}
                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-white/20"
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="p-2 text-white/10 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="w-fit ml-10 text-[10px] font-black text-amber-500/40 hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        Add Choice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-10 sticky bottom-0 bg-slate-950 pb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 rounded-2xl h-14 border border-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-[2] rounded-2xl h-14 shadow-premium bg-amber-500 hover:bg-amber-600 font-black uppercase tracking-widest flex items-center justify-center gap-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Plus className="w-6 h-6 animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            {initialData ? "Save Changes" : "Create Quiz"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
