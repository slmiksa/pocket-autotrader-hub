import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "6 أحرف على الأقل", test: (p) => p.length >= 6 },
  { label: "حرف كبير (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "حرف صغير (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "رقم (0-9)", test: (p) => /[0-9]/.test(p) },
  { label: "رمز خاص (!@#$%)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
  const { score, passedRequirements } = useMemo(() => {
    const passed = requirements.filter((req) => req.test(password));
    return {
      score: passed.length,
      passedRequirements: passed.map((r) => r.label),
    };
  }, [password]);

  const getStrengthLabel = () => {
    if (score === 0) return { label: "ضعيفة جداً", color: "bg-red-500" };
    if (score === 1) return { label: "ضعيفة", color: "bg-red-500" };
    if (score === 2) return { label: "مقبولة", color: "bg-orange-500" };
    if (score === 3) return { label: "متوسطة", color: "bg-yellow-500" };
    if (score === 4) return { label: "قوية", color: "bg-emerald-500" };
    return { label: "قوية جداً", color: "bg-emerald-600" };
  };

  const strength = getStrengthLabel();

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">قوة كلمة المرور:</span>
          <span className={cn(
            "font-medium",
            score <= 2 ? "text-red-400" : score <= 3 ? "text-yellow-400" : "text-emerald-400"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
            style={{ width: `${(score / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 gap-1.5">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-emerald-400" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const getPasswordStrength = (password: string): number => {
  return requirements.filter((req) => req.test(password)).length;
};

export const isPasswordStrong = (password: string): boolean => {
  // Require at least 3 requirements to be met (length + 2 others)
  return getPasswordStrength(password) >= 3;
};
