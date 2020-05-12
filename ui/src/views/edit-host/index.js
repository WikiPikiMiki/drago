import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'

import { useFormState } from 'react-use-form-state'

import Box from '_components/box'
import Flex from '_components/flex'
import Link from '_components/link'
import Text from '_components/text'
import Button from '_components/button'
import { Dragon as Spinner } from '_components/spinner'
import IconButton from '_components/icon-button'
import TextInput from '_components/inputs/text-input'
import { icons } from '_assets/'

import { useMutation, useQuery } from 'react-apollo'
import {
  GET_HOST,
  UPDATE_HOST,
  DELETE_LINK,
  GET_LINKS_FROM_HOST,
  CREATE_LINK,
} from '_graphql/actions'
import { navigate } from '@reach/router'
import toast from '_components/toast'
import Collapse from '_components/collapse'
import LinksList from './links-list'
import NewLinkModal from './new-link-modal'

const Container = styled(Flex)`
  flex-direction: column;
`

const IconContainer = styled(Box).attrs({
  display: 'flex',
  height: '48px',
  width: '48px',
  bg: 'neutralLighter',
  borderRadius: '4px',
})`
  position: relative;
  button {
    margin-right: auto;
  }
  align-items: center;
  justify-content: center;
`

const StatusBadge = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 4px solid white;
  position: absolute;
  right: -2px;
  bottom: -2px;
  background: ${props => (props.status === 'online' ? 'green' : props.theme.colors.neutralLight)};
`

const EditHost = ({ networkId, hostId }) => {
  const onHostUpdated = () => {
    toast.success('Host updated')
    navigate(-1)
  }

  const onHostUpdateError = () => {
    toast.error('Error updating host')
    navigate(-1)
  }

  const [formState, { text }] = useFormState()

  const getHostQuery = useQuery(GET_HOST, {
    variables: { networkId, id: hostId },
    onCompleted: data => {
      formState.setField('name', data.result.name)
      formState.setField('ipAddress', data.result.ipAddress)
      formState.setField('advertiseAddress', data.result.advertiseAddress)
      formState.setField('listenPort', data.result.listenPort)
      formState.setField('table', data.result.table)
      formState.setField('dns', data.result.dns)
      formState.setField('mtu', data.result.mtu)
      formState.setField('preUp', data.result.preUp)
      formState.setField('postUp', data.result.postUp)
      formState.setField('preDown', data.result.preDown)
      formState.setField('postDown', data.result.postDown)
      formState.setField('publicKey', data.result.publicKey)
      formState.setField('jwt', data.result.jwt)
    },
    onError: () => {
      toast.error('Error fetching host details')
      navigate(-1)
    },
  })

  const getLinksQuery = useQuery(GET_LINKS_FROM_HOST, {
    variables: { networkId, hostId },
    onError: () => {
      toast.error('Error fetching links')
      navigate(-1)
    },
  })

  const [createLink, createLinkMutation] = useMutation(CREATE_LINK, {
    variables: { networkId, ...formState.values },
    onCompleted: () => {
      toast.success('Link created')
      getLinksQuery.refetch()
    },
    onError: () => {
      toast.error('Error creating link')
    },
  })

  const [updateHost, updateHostMutation] = useMutation(UPDATE_HOST, {
    variables: { networkId, id: hostId, ...formState.values },
    onCompleted: onHostUpdated,
    onError: onHostUpdateError,
  })

  const [deleteLink, deleteLinkMutation] = useMutation(DELETE_LINK, {
    variables: { networkId, id: undefined },
    onCompleted: () => {
      toast.success('Link deleted successfully')
      getLinksQuery.refetch()
    },
    onError: () => {
      toast.error('Error deleting link')
    },
  })

  const [isNewLinkModalOpen, setNewLinkModalOpen] = useState(false)

  useEffect(() => {
    getHostQuery.refetch()
  }, [hostId, getHostQuery, deleteLinkMutation.loading])

  const onSave = () => {
    updateHost({ ...formState.values })
  }

  const handleAddLinkButtonClicked = () => {
    setNewLinkModalOpen(true)
  }

  const handleCreateLink = modalFormState => {
    createLink({ variables: { networkId, ...modalFormState.values } })
  }

  const handleDeleteLink = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    deleteLink({ variables: { id } })
  }

  const isLoading =
    getHostQuery.loading ||
    getLinksQuery.loading ||
    createLinkMutation.loading ||
    updateHostMutation.loading ||
    deleteLinkMutation.loading

  return (
    <Container>
      {isLoading ? (
        <Spinner />
      ) : (
        <Box flexDirection="column">
          <Text display="flex" textStyle="title" mb={4}>
            <IconContainer mr="12px">
              <IconButton ml="auto" icon={<icons.Cube />} />
              <StatusBadge
                status={
                  Math.abs(
                    moment(getHostQuery.data.result.lastSeen).diff(moment.now(), 'minutes')
                  ) < 5
                    ? 'online'
                    : 'offline'
                }
              />
            </IconContainer>
            {getHostQuery.data.result.name}
          </Text>

          <Text my={3}>Name</Text>
          <TextInput required {...text('name')} placeholder="new-host-1" mb={2} />

          <Text my={3}>Address</Text>
          <TextInput required {...text('ipAddress')} placeholder="10.0.8.0/24" mb={2} />

          <Text my={3}>Advertise address</Text>
          <TextInput {...text('advertiseAddress')} placeholder="wireguard.domain.io" mb={2} />

          <Text my={3}>Listen port</Text>
          <TextInput {...text('listenPort')} placeholder="51820" mb={2} />

          <Collapse title={<Text textStyle="description">Advanced settings</Text>}>
            <Text my={3}>DNS</Text>
            <TextInput {...text('dns')} placeholder="8.8.8.8" mb={2} />

            <Text my={3}>MTU</Text>
            <TextInput {...text('mtu')} placeholder="1420" mb={2} />

            <Text my={3}>Pre up</Text>
            <TextInput {...text('preUp')} placeholder="" mb={2} />

            <Text my={3}>Post up</Text>
            <TextInput {...text('postUp')} placeholder="" mb={2} />

            <Text my={3}>Pre down</Text>
            <TextInput {...text('preDown')} placeholder="" mb={2} />

            <Text my={3}>Post down</Text>
            <TextInput {...text('postDown')} placeholder="" mb={2} />
          </Collapse>

          <Collapse title={<Text textStyle="description">Control settings</Text>}>
            <Text my={3}>Public key</Text>
            <TextInput {...text('publicKey')} placeholder="N/A" mb={2} disabled />
            <Text my={3}>JWT</Text>
            <TextInput {...text('jwt')} placeholder="N/A" mb={2} disabled />
          </Collapse>

          <Collapse isOpen title={<Text textStyle="description">Links</Text>}>
            <LinksList
              onLinkAdd={handleAddLinkButtonClicked}
              onLinkDelete={handleDeleteLink}
              links={getLinksQuery.data.result.items}
            />
          </Collapse>

          <Button width="100%" borderRadius={3} mt={3} mb={4} onClick={onSave}>
            Save
          </Button>

          <NewLinkModal
            networkId={networkId}
            isOpen={isNewLinkModalOpen}
            fromHost={getHostQuery.data.result}
            onCreateLink={handleCreateLink}
            onBackgroundClick={() => setNewLinkModalOpen(false)}
            onEscapeKeydown={() => setNewLinkModalOpen(false)}
          />
        </Box>
      )}

      <Box justifyContent="center" gridColumn="4 / span 6">
        <Link color="primary" to={`/networks/${networkId}/hosts`}>
          Cancel
        </Link>
      </Box>
    </Container>
  )
}

EditHost.propTypes = {
  networkId: PropTypes.string.isRequired,
  hostId: PropTypes.string.isRequired,
}

export default EditHost
