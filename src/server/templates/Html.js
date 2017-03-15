import React, { PropTypes } from 'react';
import serialize from 'serialize-javascript';


class Html extends React.Component {
    static propTypes = {
        head: PropTypes.object,
        children: PropTypes.string,
        assets: PropTypes.object.isRequired,
        initialState: PropTypes.string,
    };

    static defaultProps = {
        initialState: {},
        head: null,
        children: null,
    };

    render() {
        const { head, children, assets, initialState } = this.props;
        const appJs = assets && assets.javascript;
        const appCss = assets && assets.styles;
        const attrs = head && head.htmlAttributes.toComponent();

        return (
            <html className="no-js" lang="en" {...attrs}>
                <head>
                    {head && head.title.toComponent()}
                    {head && head.meta.toComponent()}

                    <meta charSet="utf-8" />
                    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="theme-color" content="#f79a24" />
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css" />
                    {
                        appCss &&
                        <link rel="stylesheet" href={appCss} media="screen" />
                    }
                </head>
                <body>
                    <div id="root" dangerouslySetInnerHTML={{ __html: children }} />
                    {initialState && (
                        <script
                            dangerouslySetInnerHTML={{
                                __html: `window.__INITIAL_STATE__=${serialize(initialState, { isJSON: true })}`
                            }}
                        />
                    )}
                    <script src={appJs} />
                </body>
            </html>
        );
    }
}


export default (Html);
