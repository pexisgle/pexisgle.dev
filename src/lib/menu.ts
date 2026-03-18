import type { Component } from 'svelte';
import {
	GridSolid,
	UsersGroupSolid,
	ImageSolid,
	BriefcaseSolid,
	NewspaperSolid,
	AwardSolid,
	BadgeCheckSolid,
	LightbulbSolid,
	ShareNodesSolid,
	CogSolid
} from 'flowbite-svelte-icons';

export interface MenuItem {
	label: string;
	href: string;
	iconName: string;
	exact?: boolean;
	description?: string;
	color?: string;
}

/** Shared icon map used by SidebarNav and Dashboard page. */
export const iconMap: Record<string, Component> = {
	GridSolid,
	UsersGroupSolid,
	ImageSolid,
	BriefcaseSolid,
	NewspaperSolid,
	AwardSolid,
	BadgeCheckSolid,
	LightbulbSolid,
	ShareNodesSolid,
	CogSolid
};

export const menuItems: MenuItem[] = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		iconName: 'GridSolid',
		exact: true,
		description: 'Overview of the system.',
		color: 'text-gray-600 dark:text-gray-500'
	},
	{
		label: 'Images',
		href: '/dashboard/images',
		iconName: 'ImageSolid',
		description: 'Upload and view image assets.',
		color: 'text-purple-600 dark:text-purple-500'
	},
	{
		label: 'Works',
		href: '/dashboard/works',
		iconName: 'BriefcaseSolid',
		description: 'Manage portfolio items and projects.',
		color: 'text-green-600 dark:text-green-500'
	},
	{
		label: 'Blog',
		href: '/dashboard/blog',
		iconName: 'NewspaperSolid',
		description: 'Manage blog posts and content.',
		color: 'text-orange-600 dark:text-orange-500'
	},
	{
		label: 'Awards',
		href: '/dashboard/awards',
		iconName: 'AwardSolid',
		description: 'Manage awards and recognitions.',
		color: 'text-yellow-600 dark:text-yellow-500'
	},
	{
		label: 'Certifications',
		href: '/dashboard/certifications',
		iconName: 'BadgeCheckSolid',
		description: 'Manage certifications and credentials.',
		color: 'text-cyan-600 dark:text-cyan-500'
	},
	{
		label: 'Skills',
		href: '/dashboard/skills',
		iconName: 'LightbulbSolid',
		description: 'Manage skill list and ordering.',
		color: 'text-green-600 dark:text-green-500'
	},
	{
		label: 'SNS',
		href: '/dashboard/sns',
		iconName: 'ShareNodesSolid',
		description: 'Manage SNS links and settings.',
		color: 'text-pink-600 dark:text-pink-500'
	}
];
