import type { Page } from "../models/pageType";

export const ErrorPages: Page = {
    render: () => `
        <div class="page-container">
            <div class="card-glass text-center">
                <div class="card-header">
                    <h2 class="text-2xl font-semibold text-white mb-2">404 - Page Not Found</h2>
                    <p class="text-muted mb-4">
                        The page you are looking for does not exist.
                    </p>
                </div>
                <div class="card-body">
                    <a href="/" data-link class="btn btn-primary">
                        Go to Home Page
                    </a>
                </div>
            </div>
        </div>
    `,
};
