import { FuseNavigation } from '@fuse/types';

export const navigation: FuseNavigation[] = [
    
        {
            id: 'users',
            title: 'Users',
            type: 'collapsable',
            icon: 'group',            
            children: [
                {
                    id: 'horse_managers',
                    title: 'Horse Managers',
                    icon: 'check',
                    type: 'item',
                    url: '/users/horse-managers/list'
                },
                {
                    id: 'service_providers',
                    title: 'Service Providers',
                    icon: 'check',
                    type: 'item',
                    url: '/users/service-providers/list'
                },
                {
                    id: 'incomplete_users',
                    title: 'Incomplete',
                    icon: 'close',
                    type: 'item',
                    url: '/users/incomplete-users/list'
                }
            ]
        },
        {
            id       : 'horses',
            title    : 'Horses',
            type     : 'item',
            icon     : 'camera',
            url      : '/horses/list'
        },
        {
            id       : 'invoices',
            title    : 'Invoices',
            type     : 'item',
            icon     : 'receipt',
            url      : 'invoices/list'
        },
        {
            id       : 'requests',
            title    : 'Service Requests',
            type     : 'item',
            icon     : 'question_answer',
            url      : '/requests/list'
        },
        {
            id       : 'payments',
            title    : 'Payments',
            type     : 'item',
            icon     : 'attach_money',
            url      : '/payments'
        },
        {
            id       : 'shows',
            title    : 'Service Shows',
            type     : 'item',
            icon     : 'toys',
            url      : '/service-shows'
        },
        {
            id       : 'notifications',
            title    : 'Notifications',
            type     : 'item',
            icon     : 'notifications_none',
            url      : '/notifications'
        },
        {
            id       : 'settings',
            title    : 'Settings',
            type     : 'item',
            icon     : 'settings',
            url      : '/settings'
        }
    
];
