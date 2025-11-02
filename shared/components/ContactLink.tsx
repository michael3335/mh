'use client';

import { track } from '@vercel/analytics';

export default function ContactLink() {
    return (
        <a
            href="mailto:contact@michaelharrison.au"
            className="contactLink"
            onClick={() => track('contact_click')}
        >
            contact
        </a>
    );
}