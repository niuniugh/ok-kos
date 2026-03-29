import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	actionHref?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	actionLabel,
	onAction,
	actionHref,
}: EmptyStateProps) {
	return (
		<Empty className="border py-12">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Icon />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			{actionLabel && (
				<EmptyContent>
					{actionHref ? (
						<Button asChild>
							<Link to={actionHref}>{actionLabel}</Link>
						</Button>
					) : (
						<Button onClick={onAction}>{actionLabel}</Button>
					)}
				</EmptyContent>
			)}
		</Empty>
	);
}
