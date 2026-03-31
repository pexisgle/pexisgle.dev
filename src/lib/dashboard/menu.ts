import type { Component } from 'svelte';
import {
	GridSolid,
	ImageSolid,
	BriefcaseSolid,
	NewspaperSolid,
	AwardSolid,
	BadgeCheckSolid,
	LightbulbSolid,
	ShareNodesSolid
} from 'flowbite-svelte-icons';

export interface MenuItem {
	label: string;
	href: string;
	icon: Component;
	exact?: boolean;
	description?: string;
	color?: string;
}

export const menuItems: MenuItem[] = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		icon: GridSolid,
		exact: true,
		description: 'Overview of the system.',
		color: 'text-gray-600 dark:text-gray-500'
	},
	{
		label: 'Images',
		href: '/dashboard/images',
		icon: ImageSolid,
		description: 'Upload and view image assets.',
		color: 'text-purple-600 dark:text-purple-500'
	},
	{
		label: 'Works',
		href: '/dashboard/works',
		icon: BriefcaseSolid,
		description: 'Manage portfolio items and projects.',
		color: 'text-green-600 dark:text-green-500'
	},
	{
		label: 'Blog',
		href: '/dashboard/blog',
		icon: NewspaperSolid,
		description: 'Manage blog posts and content.',
		color: 'text-orange-600 dark:text-orange-500'
	},
	{
		label: 'Awards',
		href: '/dashboard/awards',
		icon: AwardSolid,
		description: 'Manage awards and recognitions.',
		color: 'text-yellow-600 dark:text-yellow-500'
	},
	{
		label: 'Certifications',
		href: '/dashboard/certifications',
		icon: BadgeCheckSolid,
		description: 'Manage certifications and credentials.',
		color: 'text-cyan-600 dark:text-cyan-500'
	},
	{
		label: 'Skills',
		href: '/dashboard/skills',
		icon: LightbulbSolid,
		description: 'Manage skill list and ordering.',
		color: 'text-green-600 dark:text-green-500'
	},
	{
		label: 'SNS',
		href: '/dashboard/sns',
		icon: ShareNodesSolid,
		description: 'Manage SNS links and settings.',
		color: 'text-pink-600 dark:text-pink-500'
	}
];
