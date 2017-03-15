import _ from 'lodash';
import React, { PureComponent, PropTypes } from 'react';
import { Col, FormGroup, FormControl, ControlLabel, HelpBlock } from 'react-bootstrap';
import { connect } from 'react-redux';
import cn from 'classnames';
import * as actions from '../../modules/actions';
import './SocialInput.less';


@connect(state => ({ fbUser: state.auth.fbUser }))
export default class SocialInput extends PureComponent {
    static propTypes = {
        input: PropTypes.object.isRequired,
        label: PropTypes.string.isRequired,
        dispatch: PropTypes.func.isRequired,
        provider: PropTypes.string.isRequired,
        fbUser: PropTypes.object.isRequired,
    };

    static defaultProps = {
        placeholder: '',
        help: '',
        options: [],
    };

    state = {
        error: null,
    };

    onLogOut = () => {
        this.props.input.onChange('');
    };

    onAdd = () => {
        const { fbUser: { providerData }, dispatch, provider, input: { onChange } } = this.props;

        let data = _.find(providerData, { providerId: `${provider}.com` });

        this.setState({ error: null });

        if (data) {
            onChange(data.uid);
        } else {
            dispatch(actions.linkSocialAuth(this.props.provider)).then((result) => {
                data = _.find(result.fbUser.providerData, { providerId: `${provider}.com` });
                onChange(data.uid);
            }).catch((error) => {
                this.setState({ error: error.message });
            });
        }
    };

    render() {
        const { input, label, fbUser: { providerData }, provider } = this.props;
        const { error } = this.state;
        const name = (_.find(providerData, { providerId: `${provider}.com` }) || {}).displayName;
        const validationState = error ? 'error' : null;

        return (
            <FormGroup className="SocialInput" validationState={validationState}>
                <Col componentClass={ControlLabel} sm={3} md={3} lg={4} xs={12}>
                    {label}
                </Col>
                <Col sm={9} md={9} lg={8} xs={12}>
                    <FormControl.Static>
                        {
                            input.value ?
                                <span>{name} <a onClick={this.onLogOut}>Log out</a></span> :
                                <a className={cn({ 'text-danger': error })} onClick={this.onAdd}>Add</a>
                        }
                        {error && <HelpBlock>{error}</HelpBlock>}
                    </FormControl.Static>
                </Col>
            </FormGroup>
        );
    }
}
