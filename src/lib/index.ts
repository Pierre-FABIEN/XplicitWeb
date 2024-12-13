import TransitionIcon from 'lucide-svelte/icons/arrow-left-right';
import DirectorsIcon from 'lucide-svelte/icons/users';
import AgenciesIcon from 'lucide-svelte/icons/building';
import ProductsIcon from 'lucide-svelte/icons/package';
import SnippetIcon from 'lucide-svelte/icons/code';
import StateIcon from 'lucide-svelte/icons/database';
import {
	BookMarked,
	Box,
	ChartBarIcon,
	GalleryHorizontal,
	KeyIcon,
	KeyRound,
	LayoutPanelLeft,
	MessageCircle,
	Settings2,
	Map,
	CreditCard
} from 'lucide-svelte';

export const PresentationItems = [
	{
		title: 'Accueil',
		url: '/',
		icon: DirectorsIcon
	},
	{
		title: 'Présentation',
		url: '/home/presentation',
		icon: DirectorsIcon
	},
	{
		title: 'Installation',
		url: '/home/installation',
		icon: DirectorsIcon
	}
];

export const crudItems = [
	{
		title: 'Documentation',
		url: '/crud',
		icon: DirectorsIcon
	},
	{
		title: 'Directors',
		url: '/crud/directors',
		icon: DirectorsIcon
	},
	{
		title: 'Agencies',
		url: '/crud/agencies',
		icon: AgenciesIcon
	},
	{
		title: 'Products',
		url: '/crud/products',
		icon: ProductsIcon
	},
	{
		title: 'Statistical',
		url: '/crud/stats',
		icon: ChartBarIcon
	}
];

export const stateItems = [
	{
		title: 'Snippet svelte',
		url: '/stateManager/snippet',
		icon: SnippetIcon
	},
	{
		title: 'State svelte',
		url: '/stateManager/state',
		icon: StateIcon
	}
];

export const socketItems = [
	{
		title: 'WebSocket Integration without database and protections',
		url: '/websocket',
		icon: MessageCircle
	},
	{
		title: 'Chat with database and protections',
		url: '/websocket/chat',
		icon: MessageCircle
	}
];

export const stripeItems = [
	{
		title: 'Stripe',
		url: '/stripe',
		icon: CreditCard
	}
];

export const UIUXItems = [
	{
		title: 'Transition Demo',
		url: '/UXUI/transitionDemo',
		icon: TransitionIcon
	},
	{
		title: 'Carousel',
		url: '/UXUI/carousel',
		icon: GalleryHorizontal
	},
	{
		title: 'SiteMap',
		url: '/UXUI/sitemap.xml',
		icon: Map
	},
	{
		title: 'Threlte',
		url: '/UXUI/threlte',
		icon: Box
	}
];

export const AuthItems = [
	{
		title: 'Login',
		url: '/auth/login',
		icon: KeyRound
	},
	{
		title: 'Register',
		url: '/auth/signup',
		icon: BookMarked
	},
	{
		title: 'Forgot Password',
		url: '/auth/forgot-password',
		icon: KeyIcon
	},
	{
		title: 'Dashboard',
		url: '/auth',
		icon: LayoutPanelLeft
	},
	{
		title: 'Settings',
		url: '/auth/settings',
		icon: Settings2
	}
];

export const renderProduction = [
	{
		title: 'On server / production',
		url: '/render',
		icon: KeyRound
	}
];

export const BlogItems = [
	{
		title: 'Blog',
		url: '/blog',
		icon: CreditCard
	},
	{
		title: 'create Article',
		url: '/blog/create',
		icon: CreditCard
	}
];
