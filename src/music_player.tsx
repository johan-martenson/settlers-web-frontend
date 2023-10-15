import React, { Component } from 'react';
import { Button } from '@fluentui/react-components';
import ExpandCollapseToggle from './expand_collapse_toggle';
import './music_player.css';
import { FastForward24Filled, Pause24Filled, Play24Filled } from '@fluentui/react-icons';

interface MusicPlayerProps { }

interface MusicPlayerState {
    expanded: boolean
    currentSong: number
    playing: boolean
}

interface AudioAtlasSongs {
    path: string
    title: string
}

class MusicPlayer extends Component<MusicPlayerProps, MusicPlayerState> {

    private audioAtlasSongs?: AudioAtlasSongs[]
    private audioInstances: HTMLAudioElement[]

    constructor(props: MusicPlayerProps) {
        super(props);

        this.audioInstances = []

        this.state = {
            expanded: false,
            currentSong: 0,
            playing: false
        }
    }

    async componentDidMount() {
        const result = await fetch('assets/audio-atlas-music.json')

        this.audioAtlasSongs = await result.json()

        this.audioAtlasSongs?.forEach(song => this.audioInstances.push(new Audio(song.path)))
    }

    play(): void {
        if (this.audioAtlasSongs) {
            this.audioInstances[this.state.currentSong].onended = () => { this.next() }
            this.audioInstances[this.state.currentSong].play()

            this.setState({ playing: true })
        }
    }

    pause(): void {
        if (this.audioAtlasSongs) {
            this.audioInstances[this.state.currentSong].pause()

            this.setState({ playing: false })
        }
    }

    next(): void {
        if (this.state.playing) {
            this.audioInstances[this.state.currentSong].pause()
        }

        const currentSong = this.state.currentSong
        let newSong

        if (currentSong < this.audioInstances.length - 1) {
            newSong = currentSong + 1
        } else {
            newSong = 0
        }

        if (this.state.playing) {
            this.audioInstances[newSong].currentTime = 0
            this.audioInstances[newSong].onended = () => { this.next() }
            this.audioInstances[newSong].play()
        }

        this.setState({ currentSong: newSong })
    }

    playSong(newSong: number): void {
        if (this.state.playing) {
            this.audioInstances[this.state.currentSong].pause()
        }

        this.audioInstances[newSong].currentTime = 0
        this.audioInstances[newSong].onended = () => { this.next() }
        this.audioInstances[newSong].play()

        this.setState({
            currentSong: newSong,
            playing: true
        })
    }

    render() {

        return (
            <div className="music-player">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} inverted />
                <div> <b>Music</b></div>

                {this.state.playing && this.audioAtlasSongs && this.state.expanded &&
                    <div> Playing: {this.audioAtlasSongs[this.state.currentSong].title} </div>
                }

                {this.state.expanded &&
                    <>
                        <div>
                            {this.state.playing &&
                                <span><Button onClick={this.pause.bind(this)} icon={<Pause24Filled />} appearance='transparent'/></span>
                            }

                            {!this.state.playing &&
                                <span><Button onClick={this.play.bind(this)} icon={<Play24Filled/>} appearance='transparent'/></span>
                            }

                            <span><Button onClick={this.next.bind(this)} icon={<FastForward24Filled />} appearance='transparent'/></span>
                        </div>

                        <div id="SongList">

                            {this.audioAtlasSongs &&
                                this.audioAtlasSongs.map(
                                    (song, index) => {

                                        return (
                                            <div className={(index === this.state.currentSong) ? "PlayingSongItem" : "SongItem"}
                                                key={index}
                                                onClick={() => { this.playSong(index) }}
                                            >
                                                {song.title}
                                            </div>
                                        )
                                    }
                                )
                            }
                        </div>
                    </>
                }
            </div>
        );
    }
}

export default MusicPlayer;