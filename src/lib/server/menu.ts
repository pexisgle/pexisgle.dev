import type { Role } from '$lib/server/db/schema';

export interface MenuItem {
	label: string;
	href: string;
	iconName: string;
	requiredRole: Role;
	exact?: boolean;
	description?: string;
	color?: string;
}

export const menuItems: MenuItem[] = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		iconName: 'GridSolid',
		requiredRole: 'user',
		exact: true,
		description: 'Overview of the system.',
		color: 'text-gray-600 dark:text-gray-500'
	},
	{
		label: 'Users',
		href: '/dashboard/users',
		iconName: 'UsersGroupSolid',
		requiredRole: 'admin',
		description: 'Manage registered users and access roles.',
		color: 'text-blue-600 dark:text-blue-500'
	},
	{
		label: 'Images',
		href: '/dashboard/images',
		iconName: 'ImageSolid',
		requiredRole: 'admin',
		description: 'Upload and view image assets.',
		color: 'text-purple-600 dark:text-purple-500'
	},
	{
		label: 'Works',
		href: '/dashboard/works',
		iconName: 'BriefcaseSolid',
		requiredRole: 'admin',
		description: 'Manage portfolio items and projects.',
		color: 'text-green-600 dark:text-green-500'
	},
	{
		label: 'Blog',
		href: '/dashboard/blog',
		iconName: 'NewspaperSolid',
		requiredRole: 'admin',
		description: 'Manage blog posts and content.',
		color: 'text-orange-600 dark:text-orange-500'
	},
	{
		label: 'Awards',
		href: '/dashboard/awards',
		iconName: 'AwardSolid',
		requiredRole: 'admin',
		description: 'Manage awards and recognitions.',
		color: 'text-yellow-600 dark:text-yellow-500'
	},
	{
		label: 'Certifications',
		href: '/dashboard/certifications',
		iconName: 'BadgeCheckSolid',
		requiredRole: 'admin',
		description: 'Manage certifications and credentials.',
		color: 'text-cyan-600 dark:text-cyan-500'
	},
	{
		label: 'Skills',
		href: '/dashboard/skills',
		iconName: 'LightbulbSolid',
		requiredRole: 'user',
		description: 'Manage skill list and ordering.',
		color: 'text-green-600 dark:text-green-500'
	},
	{
		label: 'SNS',
		href: '/dashboard/sns',
		iconName: 'ShareNodesSolid',
		requiredRole: 'user',
		description: 'Manage SNS links and settings.',
		color: 'text-pink-600 dark:text-pink-500'
	}
];
