import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
}

interface UserAvatarProps {
  readonly user: User;
  readonly size?: "sm" | "md" | "lg";
  readonly showName?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

const getInitials = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "??";
};

const getFullName = (user: User): string => {
  // Priorité 1 : username
  if (user.username) {
    return user.username;
  }
  // Priorité 2 : firstName + lastName
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  // Priorité 3 : firstName seul
  if (user.firstName) {
    return user.firstName;
  }
  // Priorité 4 : email en dernier recours
  return user.email;
};

const getAvatarColor = (userId: string): string => {
  // Générer une couleur basée sur l'ID de l'utilisateur
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  
  const hash = userId.split('').reduce((acc, char) => {
    const code = char.codePointAt(0);
    return acc + (code ?? 0);
  }, 0);
  return colors[hash % colors.length];
};

const getRoleLabel = (role: string): string => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'MANAGER') return 'Manager';
  return 'Employé';
};

export function UserAvatar({ user, size = "md", showName = false }: UserAvatarProps) {
  const initials = getInitials(user);
  const fullName = getFullName(user);
  const colorClass = getAvatarColor(user.id);
  const roleLabel = getRoleLabel(user.role);

  if (showName) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={undefined} alt={fullName} />
          <AvatarFallback className={`${colorClass} text-white font-semibold`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {fullName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {roleLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Avatar className={sizeClasses[size]} title={fullName}>
      <AvatarImage src={undefined} alt={fullName} />
      <AvatarFallback className={`${colorClass} text-white font-semibold`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
